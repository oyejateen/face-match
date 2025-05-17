import requests
import os

def test_face_verification():
    # URL of your API
    url = 'http://192.168.122.166:5000/verify'
    
    # Create a directory for test images if it doesn't exist
    if not os.path.exists('test_images'):
        os.makedirs('test_images')
        print("Please place your test images in the 'test_images' directory")
        print("You need at least one target image and one or more comparison images")
        return
    
    # Get all images from the test_images directory
    image_files = [f for f in os.listdir('test_images') if f.endswith(('.jpg', '.jpeg', '.png'))]
    
    if len(image_files) < 2:
        print("Please add at least 2 images to the test_images directory")
        return
    
    # Use the first image as target
    target_image = image_files[0]
    comparison_images = image_files[1:]
    
    # Prepare the files for the request
    files = [
        ('target', ('target.jpg', open(os.path.join('test_images', target_image), 'rb')))
    ]
    
    # Add comparison images
    for img in comparison_images:
        files.append(('comparisons', (img, open(os.path.join('test_images', img), 'rb'))))
    
    print(f"Target image: {target_image}")
    print(f"Comparison images: {comparison_images}")
    
    # Make the request
    try:
        response = requests.post(url, files=files)
        print("\nAPI Response:")
        print(response.json())
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        # Close all opened files
        for _, (_, file) in files:
            file.close()

if __name__ == '__main__':
    test_face_verification() 