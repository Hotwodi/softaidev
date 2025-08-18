from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import os

def create_office_image(output_path, width=1200, height=630):
    """Create a professional office meeting image with a team and clients."""
    # Create a new image with a light blue background (office-like color)
    img = Image.new('RGB', (width, height), color=(240, 245, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a subtle grid pattern for the floor
    for i in range(0, width, 30):
        draw.line([(i, 0), (i, height)], fill=(230, 235, 245), width=1)
    for i in range(0, height, 30):
        draw.line([(0, i), (width, i)], fill=(230, 235, 245), width=1)
    
    # Draw a large conference table (ellipse)
    table_color = (139, 69, 19)  # Brown
    table = (width//4, height//3, 3*width//4, 2*height//3)
    draw.ellipse(table, fill=table_color, outline=(89, 39, 0), width=3)
    
    # Draw chairs around the table (simple circles)
    chair_color = (160, 82, 45)  # Sienna
    for angle in range(0, 360, 45):
        rad = angle * 3.14159 / 180
        x = width//2 + int(200 * 1.5 * (1 if angle % 90 == 0 else 0.7) * (1 if angle < 180 else -1) * (1 if angle % 180 < 90 else -1))
        y = height//2 + int(100 * 1.5 * (1 if angle % 90 == 0 else 0.7) * (1 if angle > 90 and angle < 270 else -1) * (1 if (angle+90) % 180 < 90 else -1))
        draw.ellipse((x-20, y-20, x+20, y+20), fill=chair_color, outline=(100, 50, 20), width=2)
    
    # Draw simple stick figures for people
    def draw_person(x, y, color, facing='right'):
        # Head
        draw.ellipse((x-10, y-20, x+10, y), fill=(255, 218, 185), outline=(139, 69, 19), width=1)
        # Body
        draw.line([(x, y), (x, y+40)], fill=color, width=3)
        # Arms
        draw.line([(x, y+15), (x+15 if facing == 'right' else x-15, y+25)], fill=color, width=3)
        draw.line([(x, y+15), (x-15 if facing == 'right' else x+15, y+25)], fill=color, width=3)
        # Legs
        draw.line([(x, y+40), (x+10, y+70)], fill=color, width=3)
        draw.line([(x, y+40), (x-10, y+70)], fill=color, width=3)
    
    # Draw team members and clients around the table
    team_colors = [(70, 130, 180), (72, 61, 139), (65, 105, 225)]  # Team member colors
    client_colors = [(178, 34, 34), (139, 0, 139), (0, 139, 139)]  # Client colors
    
    # Team members (left side)
    draw_person(width//3, height//2, team_colors[0], 'right')
    draw_person(width//3, height//2 - 60, team_colors[1], 'right')
    
    # Clients (right side)
    draw_person(2*width//3, height//2, client_colors[0], 'left')
    draw_person(2*width//3, height//2 - 60, client_colors[1], 'left')
    
    # Add a white semi-transparent overlay for text
    overlay = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle([(0, 0), (width, height//3)], fill=(26, 35, 126, 180))  # Dark blue with transparency
    
    # Add text
    try:
        font = ImageFont.truetype("arialbd.ttf", 42)
    except IOError:
        font = ImageFont.load_default()
    
    overlay_draw.text((width//2, 70), "SoftAIDev", fill=(255, 255, 255), font=font, anchor="mm")
    try:
        font_small = ImageFont.truetype("arial.ttf", 24)
    except IOError:
        font_small = ImageFont.load_default()
    overlay_draw.text((width//2, 120), "Professional Software Solutions & Consulting", fill=(200, 200, 255), font=font_small, anchor="mm")
    
    # Composite the overlay
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    
    # Save the image
    img.save(output_path, quality=95)
    print(f"Created office meeting image at: {output_path}")

if __name__ == "__main__":
    # Create images directory if it doesn't exist
    os.makedirs("images", exist_ok=True)
    
    # Generate the office meeting image
    create_office_image("images/softaidev-social.jpg")
    
    # Create a variation for the blog
    create_office_image("images/blog-preview.jpg")
    
    # Create a variation for services
    create_office_image("images/services-preview.jpg")
