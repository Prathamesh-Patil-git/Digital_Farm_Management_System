import phonenumbers
import random
from twilio.rest import Client
from app.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, Config

class OTPService:
    def __init__(self):
        self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    def parse_phone(self, phone_number):
        try:
            # If no +91 is included, parse with India as default
            if not phone_number.startswith("+"):
            # country 'IN' as default region
                parsed = phonenumbers.parse(phone_number, "IN")
            else:
                parsed = phonenumbers.parse(phone_number)

            if not phonenumbers.is_valid_number(parsed):
                return None

            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

        except:
            return None

    def send_otp(self, phone_number):
        if Config.TEST_OTP_MODE:
            # Generate a dummy OTP for testing
            test_otp = str(random.randint(100000, 999999))
            print(f"[TEST MODE] Sending OTP {test_otp} to {phone_number}")
            # In a real scenario, you might store this test_otp temporarily for verification
            return "test_sid"

        try:
            e164 = self.parse_phone(phone_number)
            if not e164:
                print("Invalid phone:", phone_number)
                return None

            verification = self.client.verify.v2.services(
                TWILIO_VERIFY_SERVICE_SID
            ).verifications.create(
                to=e164,
                channel="sms"
            )
            return verification.sid

        except Exception as e:
            print("Error sending OTP:", e)
            return None

    def verify_otp(self, phone_number, otp_code):
        if Config.TEST_OTP_MODE:
            # For testing, assume a fixed OTP or any OTP is valid
            print(f"[TEST MODE] Verifying OTP {otp_code} for {phone_number}")
            return otp_code == "123456"  # Example: always approve if OTP is 123456

        try:
            e164 = self.parse_phone(phone_number)
            if not e164:
                print("Invalid phone:", phone_number)
                return False

            result = self.client.verify.v2.services(
                TWILIO_VERIFY_SERVICE_SID
            ).verification_checks.create(
                to=e164,
                code=otp_code
            )
            return result.status == "approved"

        except Exception as e:
            print("Error verifying OTP:", e)
            return False
