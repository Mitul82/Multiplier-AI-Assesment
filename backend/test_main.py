import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import main


class SiteShelfApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temporary_directory.name) / "test.db"
        self.database_patch = patch.object(main, "DATABASE_PATH", self.database_path)
        self.database_patch.start()
        self.client = TestClient(main.app)
        self.client.__enter__()

    def tearDown(self) -> None:
        self.client.__exit__(None, None, None)
        self.database_patch.stop()
        self.temporary_directory.cleanup()

    def sign_up(self, email: str = "reader@example.com") -> dict[str, object]:
        response = self.client.post(
            "/api/auth/signup",
            json={"name": "Site Reader", "email": email, "password": "secure-pass-123"},
        )
        self.assertEqual(response.status_code, 201)
        return response.json()

    def test_signup_login_and_user_scoped_saved_previews(self) -> None:
        account = self.sign_up()
        token = account["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        saved = self.client.post(
            "/api/urls",
            headers=headers,
            json={"url": "www.justdial.com/Hyderabad/Dr-Sarita-Rao"},
        )
        self.assertEqual(saved.status_code, 201)
        saved_data = saved.json()
        self.assertEqual(saved_data["url"], "https://www.justdial.com/Hyderabad/Dr-Sarita-Rao")
        self.assertEqual(saved_data["preview_url"], saved_data["url"])
        self.assertEqual(saved_data["preview_title"], "justdial.com")

        listed = self.client.get("/api/urls", headers=headers)
        self.assertEqual(listed.status_code, 200)
        self.assertEqual([item["id"] for item in listed.json()], [saved_data["id"]])

        other_account = self.sign_up("another@example.com")
        other_headers = {"Authorization": f"Bearer {other_account['access_token']}"}
        self.assertEqual(self.client.get("/api/urls", headers=other_headers).json(), [])

        login = self.client.post(
            "/api/auth/login",
            json={"email": "READER@example.com", "password": "secure-pass-123"},
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["user"]["email"], "reader@example.com")

    def test_rejects_bad_credentials_and_unsafe_urls(self) -> None:
        self.sign_up()
        wrong_password = self.client.post(
            "/api/auth/login",
            json={"email": "reader@example.com", "password": "wrong-password"},
        )
        self.assertEqual(wrong_password.status_code, 401)

        duplicate = self.client.post(
            "/api/auth/signup",
            json={"name": "Again", "email": "reader@example.com", "password": "secure-pass-123"},
        )
        self.assertEqual(duplicate.status_code, 409)

        unauthenticated = self.client.get("/api/urls")
        self.assertEqual(unauthenticated.status_code, 401)

        token = self.sign_up("second@example.com")["access_token"]
        response = self.client.post(
            "/api/urls",
            headers={"Authorization": f"Bearer {token}"},
            json={"url": "javascript:alert(1)"},
        )
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
