import os
from flask import Flask, render_template, request, jsonify, session, send_file
from flask_socketio import SocketIO, emit, join_room, leave_room
from openai import OpenAI
from dotenv import load_dotenv
import uuid
from collections import defaultdict
from file_manager import FileManager
from rag_manager import get_rag_manager

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

# Initialize file manager
file_manager = FileManager()

# Initialize RAG manager
rag_manager = get_rag_manager()

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
        use_rag = data.get('use_rag', False)  # RAG engedélyezése
        
        if not message:
            emit('error', {'message': 'Message cannot be empty'}, room=user_id)
            return
            
        print(f"Received message from user {user_id}: {message}")
        
        # Initialize conversation history if it doesn't exist
        if user_id not in conversations:
            conversations[user_id] = [
                {"role": "system", "content": "You are a helpful assistant that speaks Hungarian."}
            ]
        
        # RAG context handling
        rag_context = ""
        rag_results = None  # Initialize rag_results to None for each request
        if use_rag and rag_manager and rag_manager.is_ready():
            try:
                print(f"🔍 RAG search for message: '{message}'")
                # Search for relevant documents
                rag_results = rag_manager.search_documents(message, top_k=3)
                print(f"🔍 RAG search returned {len(rag_results) if rag_results else 0} results")
                if rag_results:
                    rag_context = "\n\nRelevant information from documents:\n"
                    for i, result in enumerate(rag_results[:3], 1):
                        rag_context += f"\n{i}. From {result['source']}:\n{result['content'][:500]}...\n"
                    
                    # Emit RAG sources to frontend
                    emit('rag_sources', {
                        'sources': [{
                            'source': result['source'],
                            'content': result['content'][:200] + '...',
                            'relevance_score': result['relevance_score']
                        } for result in rag_results]
                    }, room=user_id)
            except Exception as e:
                print(f"RAG search error: {e}")
                emit('rag_error', {'message': f'RAG search failed: {str(e)}'}, room=user_id)
        
        # If this is a regeneration, remove the last assistant message if it exists
        if regenerate and conversations[user_id] and conversations[user_id][-1]["role"] == "assistant":
            conversations[user_id].pop()
        
        # Add user message to conversation history
        if not regenerate:
            # Add RAG context to the message if available
            enhanced_message = message + rag_context if rag_context else message
            user_message = {"role": "user", "content": enhanced_message}
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
                
                # Add to message history with RAG sources if available
                message_data = {
                    'id': response_id,
                    'role': 'assistant',
                    'content': assistant_response,
                    'edited': False
                }
                
                # Add RAG sources if they exist
                if rag_results is not None and rag_results:
                    print(f"💾 Storing RAG sources for message {response_id}: {[r['source'] for r in rag_results]}")
                    message_data['rag_sources'] = [{
                        'source': result['source'],
                        'content': result['content'][:200] + '...',
                        'relevance_score': result['relevance_score']
                    } for result in rag_results]
                else:
                    print(f"💾 No RAG sources to store for message {response_id}")
                
                message_history[user_id].append(message_data)
                
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

# File Manager Routes
@app.route('/api/files', methods=['GET'])
def list_files():
    """List files in directory"""
    path = request.args.get('path', '')
    result, status_code = file_manager.list_directory(path)
    return jsonify(result), status_code

@app.route('/api/files/upload', methods=['POST'])
def upload_file():
    """Upload a file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    path = request.form.get('path', '')
    
    result, status_code = file_manager.upload_file(file, path)
    return jsonify(result), status_code

@app.route('/api/files/folder', methods=['POST'])
def create_folder():
    """Create a new folder"""
    data = request.get_json()
    path = data.get('path', '')
    folder_name = data.get('name', '')
    
    if not folder_name:
        return jsonify({'error': 'Folder name is required'}), 400
    
    result, status_code = file_manager.create_folder(path, folder_name)
    return jsonify(result), status_code

@app.route('/api/files/<path:file_path>', methods=['DELETE'])
def delete_file(file_path):
    """Delete a file or folder"""
    result, status_code = file_manager.delete_item(file_path)
    return jsonify(result), status_code

@app.route('/api/files/<path:file_path>/rename', methods=['PUT'])
def rename_file(file_path):
    """Rename a file or folder"""
    data = request.get_json()
    new_name = data.get('new_name', '')
    
    if not new_name:
        return jsonify({'error': 'New name is required'}), 400
    
    result, status_code = file_manager.rename_item(file_path, new_name)
    return jsonify(result), status_code

@app.route('/api/files/<path:file_path>/content', methods=['GET'])
def get_file_content(file_path):
    """Get file content for preview"""
    result, status_code = file_manager.get_file_content(file_path)
    return jsonify(result), status_code

@app.route('/api/files/<path:file_path>/download', methods=['GET'])
def download_file(file_path):
    """Download a file"""
    try:
        full_path = file_manager.base_path / file_path
        if not full_path.exists() or not full_path.is_file():
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(str(full_path), as_attachment=True)
    except Exception as e:
        return jsonify({'error': f'Failed to download file: {str(e)}'}), 500

@app.route('/api/files/<path:file_path>/view', methods=['GET'])
def view_file(file_path):
    """View a file inline (for PDF preview)"""
    try:
        full_path = file_manager.base_path / file_path
        if not full_path.exists() or not full_path.is_file():
            return jsonify({'error': 'File not found'}), 404
        
        # Send file inline (not as attachment) for preview
        return send_file(str(full_path), as_attachment=False)
    except Exception as e:
        return jsonify({'error': f'Failed to view file: {str(e)}'}), 500

@app.route('/api/files/copy', methods=['POST'])
def copy_files():
    """Copy multiple files"""
    data = request.get_json()
    files = data.get('files', [])
    destination = data.get('destination', '')
    
    if not files:
        return jsonify({'error': 'No files specified'}), 400
    
    result, status_code = file_manager.copy_files(files, destination)
    return jsonify(result), status_code

@app.route('/api/files/move', methods=['POST'])
def move_files():
    """Move multiple files"""
    data = request.get_json()
    files = data.get('files', [])
    destination = data.get('destination', '')
    
    if not files:
        return jsonify({'error': 'No files specified'}), 400
    
    result, status_code = file_manager.move_files(files, destination)
    return jsonify(result), status_code

@app.route('/api/files/bulk-delete', methods=['POST'])
def bulk_delete_files():
    """Delete multiple files"""
    data = request.get_json()
    files = data.get('files', [])
    
    if not files:
        return jsonify({'error': 'No files specified'}), 400
    
    result, status_code = file_manager.bulk_delete(files)
    return jsonify(result), status_code

# RAG API Endpoints
@app.route('/api/rag/process', methods=['POST'])
def process_documents():
    """Process all documents in uploads directory for RAG"""
    try:
        if not rag_manager:
            return jsonify({"error": "RAG system not available"}), 500
        
        # Process documents with progress tracking
        progress_data = {"progress": 0, "status": "Starting..."}
        
        def progress_callback(progress, status):
            progress_data["progress"] = progress
            progress_data["status"] = status
            # Emit progress to all connected clients
            socketio.emit('rag_progress', progress_data)
        
        stats = rag_manager.process_documents(progress_callback)
        
        return jsonify({
            "success": True,
            "message": "Documents processed successfully",
            "stats": stats
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/search', methods=['POST'])
def search_documents():
    """Search documents using RAG"""
    try:
        if not rag_manager:
            return jsonify({"error": "RAG system not available"}), 500
        
        data = request.get_json()
        query = data.get('query', '')
        top_k = data.get('top_k', 5)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        results = rag_manager.search_documents(query, top_k)
        
        return jsonify({
            "success": True,
            "query": query,
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/stats', methods=['GET'])
def get_rag_stats():
    """Get RAG database statistics"""
    try:
        if not rag_manager:
            return jsonify({"error": "RAG system not available"}), 500
        
        stats = rag_manager.get_database_stats()
        
        return jsonify({
            "success": True,
            "stats": stats
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/clear', methods=['POST'])
def clear_rag_database():
    """Clear RAG database"""
    try:
        if not rag_manager:
            return jsonify({"error": "RAG system not available"}), 500
        
        success = rag_manager.clear_database()
        
        if success:
            return jsonify({
                "success": True,
                "message": "Database cleared successfully"
            })
        else:
            return jsonify({"error": "Failed to clear database"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host='localhost', port=5001)
