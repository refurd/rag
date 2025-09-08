import os
from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from openai import OpenAI
from dotenv import load_dotenv
import uuid
from collections import defaultdict

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sessions')
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 1 day in seconds

# Initialize the session
from flask_session import Session
Session(app)

# Initialize Socket.IO with CORS support
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables.")
    print("Please set your OpenAI API key in the .env file.")
    # For demo purposes, we'll use a placeholder
    api_key = "demo-key-please-set-real-key"

client = OpenAI(api_key=api_key)

# Store conversation history
conversations = {}
# Store message history with IDs
message_history = defaultdict(list)

@app.route('/')
def home():
    # Generate a unique session ID if it doesn't exist
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    
    # Initialize user's conversation history if it doesn't exist
    user_id = session['user_id']
    if user_id not in conversations:
        conversations[user_id] = [
            {"role": "system", "content": "You are a helpful assistant that speaks Hungarian."}
        ]
    
    return render_template('index.html', user_id=user_id)

@socketio.on('connect')
def handle_connect():
    try:
        # Get the session ID from the request cookies
        from flask import request
        session_id = request.cookies.get('session')
        
        # If no session ID, create a new one
        if not session_id or 'user_id' not in session:
            user_id = str(uuid.uuid4())
            session['user_id'] = user_id
            session.modified = True
            
            # Initialize empty history for new users
            if user_id not in message_history:
                message_history[user_id] = []
            
            if user_id not in conversations:
                conversations[user_id] = [
                    {"role": "system", "content": "You are a helpful assistant that speaks Hungarian."}
                ]
        else:
            user_id = session['user_id']
            
            # Initialize history if it doesn't exist
            if user_id not in message_history:
                message_history[user_id] = []
            
            if user_id not in conversations:
                conversations[user_id] = [
                    {"role": "system", "content": "You are a helpful assistant that speaks Hungarian."}
                ]
        
        # Join the room for this user
        join_room(user_id)
        
        # Send the connection confirmation with message history
        emit('connected', {
            'user_id': user_id,
            'messages': message_history.get(user_id, [])
        })
        
        print(f"User {user_id} connected")
        
    except Exception as e:
        print(f"Error handling connection: {str(e)}")
        emit('error', {'message': 'Connection error'})

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    leave_room(user_id)

@socketio.on('send_message')
def handle_message(data):
    try:
        user_id = session.get('user_id')
        if not user_id:
            user_id = str(uuid.uuid4())
            session['user_id'] = user_id
            
        message = data.get('message')
        message_id = data.get('message_id')
        regenerate = data.get('regenerate', False)
        
        if not message:
            emit('error', {'message': 'Message cannot be empty'}, room=user_id)
            return
            
        print(f"Received message from user {user_id}: {message}")
        
        # Initialize conversation history if it doesn't exist
        if user_id not in conversations:
            conversations[user_id] = [
                {"role": "system", "content": "You are a helpful assistant that speaks Hungarian."}
            ]
        
        # If this is a regeneration, remove the last assistant message if it exists
        if regenerate and conversations[user_id] and conversations[user_id][-1]["role"] == "assistant":
            conversations[user_id].pop()
        
        # Add user message to conversation history
        if not regenerate:
            user_message = {"role": "user", "content": message}
            conversations[user_id].append(user_message)
            
            # Add to message history with ID
            if not message_id:
                message_id = f"user-{uuid.uuid4()}"
                
            message_history[user_id].append({
                'id': message_id,
                'role': 'user',
                'content': message,
                'edited': False
            })
        
        print(f"Sending to OpenAI: {conversations[user_id]}")
        
        try:
            # Generate a unique ID for the assistant's response
            response_id = str(uuid.uuid4())
            
            # Get response from OpenAI
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=conversations[user_id],
                temperature=0.7,
                stream=True
            )
            
            assistant_response = ""
            
            # Emit the start of the assistant's response
            emit('stream', {
                'message_id': response_id,
                'content': '',
                'done': False
            }, room=user_id)
            
            # Stream the response
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    assistant_response += content
                    emit('stream', {
                        'message_id': response_id,
                        'content': content,
                        'done': False
                    }, room=user_id)
            
            # Add assistant response to conversation history
            if assistant_response:
                conversations[user_id].append({"role": "assistant", "content": assistant_response})
                
                # Add to message history
                message_history[user_id].append({
                    'id': response_id,
                    'role': 'assistant',
                    'content': assistant_response,
                    'edited': False
                })
                
                emit('stream', {
                    'message_id': response_id,
                    'content': '',
                    'done': True
                }, room=user_id)
                
                print(f"Assistant response: {assistant_response}")
            else:
                emit('error', {'message': 'Received empty response from AI'}, room=user_id)
                
        except Exception as e:
            print(f"Error in OpenAI API call: {str(e)}")
            emit('error', {'message': f'Error communicating with AI: {str(e)}'}, room=user_id)
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        emit('error', {'message': 'An unexpected error occurred'}, room=user_id)

@socketio.on('update_message')
def handle_update_message(data):
    try:
        user_id = session.get('user_id')
        if not user_id:
            emit('error', {'message': 'User not authenticated'}, room=request.sid)
            return
            
        message_id = data.get('message_id')
        new_content = data.get('new_content')
        
        if not message_id or new_content is None:
            emit('error', {'message': 'Missing message_id or new_content'}, room=user_id)
            return
            
        print(f"Updating message {message_id} for user {user_id}")
        
        # Find the message in the message history
        message_found = False
        original_content = None
        
        for msg in message_history.get(user_id, []):
            if msg['id'] == message_id:
                original_content = msg['content']
                msg['content'] = new_content
                msg['edited'] = True
                message_found = True
                
                # Update the conversation history
                # Find and update the corresponding message in conversation history
                if user_id in conversations:
                    for i, conv_msg in enumerate(conversations[user_id]):
                        if (conv_msg.get('role') == msg['role'] and 
                            conv_msg.get('content') == original_content):
                            conversations[user_id][i]['content'] = new_content
                            print(f"Updated conversation history at index {i}: {msg['role']} message")
                            break
                
                print(f"Updated message {message_id}: '{original_content}' -> '{new_content}'")
                break
        
        if message_found:
            emit('message_updated', {
                'message_id': message_id,
                'new_content': new_content
            }, room=user_id)
        else:
            emit('error', {'message': 'Message not found'}, room=user_id)
            
    except Exception as e:
        print(f"Error updating message: {str(e)}")
        emit('error', {'message': 'Failed to update message'}, room=user_id)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)
