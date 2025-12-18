import os
import uuid
import requests

class StorageService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_KEY")  # service_role key (SECRET)
        self.bucket = os.getenv("SUPABASE_BUCKET", "dfms")

        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
        }

    # -----------------------------------------------------
    # Upload raw file bytes to Supabase
    # -----------------------------------------------------
    def upload_file(self, storage_path, file_bytes, content_type="application/octet-stream"):
        upload_url = f"{self.url}/storage/v1/object/{self.bucket}/{storage_path}"

        response = requests.post(
            upload_url,
            headers={**self.headers, "Content-Type": content_type},
            data=file_bytes
        )

        if response.status_code not in (200, 201):
            raise Exception(f"Supabase upload failed: {response.text}")

        return storage_path

    # -----------------------------------------------------
    # Generate signed public URL
    # -----------------------------------------------------
    def get_signed_url(self, storage_path, expires_in=3600 * 24 * 365):  # 1 year
        signed_url_endpoint = f"{self.url}/storage/v1/object/sign/{self.bucket}/{storage_path}"

        data = {"expiresIn": expires_in}

        res = requests.post(
            signed_url_endpoint,
            headers=self.headers,
            json=data
        )

        if res.status_code != 200:
            raise Exception(f"Signed URL generation failed: {res.text}")

        return f"{self.url}{res.json()['signedURL']}"

    # -----------------------------------------------------
    # Helper – Generate unique filename
    # -----------------------------------------------------
    def generate_path(self, folder, filename):
        ext = filename.split(".")[-1]
        unique = str(uuid.uuid4())
        return f"{folder}/{unique}.{ext}"
