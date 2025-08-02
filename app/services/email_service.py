import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.models.campaign import Campaign
from app.models.contact import Contact

def send_campaign_email(campaign: Campaign, contact: Contact):
    """
    Send a campaign email to a specific contact
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = campaign.subject
        msg['From'] = settings.SMTP_USER
        msg['To'] = contact.email
        
        # Create HTML content
        html_content = f"""
        <html>
        <body>
            <h2>{campaign.name}</h2>
            <p>{campaign.content}</p>
            <hr>
            <p><small>To unsubscribe, click <a href="#">here</a></small></p>
        </body>
        </html>
        """
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Error sending email to {contact.email}: {str(e)}")
        return False

def send_welcome_email(user_email: str, username: str):
    """
    Send welcome email to new users
    """
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Welcome to Mailflow!"
        msg['From'] = settings.SMTP_USER
        msg['To'] = user_email
        
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to Mailflow, {username}!</h2>
            <p>Thank you for joining our email marketing platform.</p>
            <p>Start creating amazing campaigns and grow your audience today!</p>
        </body>
        </html>
        """
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Error sending welcome email: {str(e)}")
        return False 