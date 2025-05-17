from flask import Flask, request, jsonify
from deepface import DeepFace
import cv2
import numpy as np

app = Flask(__name__)

@app.route('/verify', methods=['POST'])
def verify_faces():
    if 'target' not in request.files:
        return jsonify({"error": "No target image provided"}), 400
    
    target_file = request.files['target'].read()
    target_img = cv2.imdecode(np.frombuffer(target_file, np.uint8), -1)
    
    results = {"matches": [], "non_matches": []}
    
    # Get all comparison images
    comparison_files = request.files.getlist('comparisons')
    print(f"got these files: {request.files}")
    if not comparison_files:
        return jsonify({"error": "No comparison images provided"}), 400
    
    print(f"Processing {len(comparison_files)} comparison images")
    
    # Process each comparison image
    for file in comparison_files:
        try:
            print(f"Processing comparison image: {file.filename}")
            file_content = file.read()
            comparison_img = cv2.imdecode(np.frombuffer(file_content, np.uint8), -1)
            
            verification = DeepFace.verify(target_img, comparison_img, 
                                         model_name='Facenet', 
                                         detector_backend='retinaface')
            
            print(f"Verification result for {file.filename}: {verification['verified']}")
            
            if verification['verified']:
                results['matches'].append(file.filename)
            else:
                results['non_matches'].append(file.filename)
                
        except Exception as e:
            print(f"Error processing {file.filename}: {str(e)}")
            results['non_matches'].append(file.filename)
    
    print(f"Final results: {results}")
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
