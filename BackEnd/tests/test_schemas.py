import unittest

from pydantic import ValidationError

from schemas.auth import LoginIn, RegisterIn, ResetPasswordIn, UserOut


class _FakeRole:
    code = "CANDIDATE"


class _FakeUser:
    id = 1
    email = "a@b.com"
    full_name = "An"
    role = _FakeRole
    email_verified_at = None


class SchemaTest(unittest.TestCase):
    def test_email_duoc_chuan_hoa(self):
        self.assertEqual(LoginIn(email="  A@Example.COM ", password="x").email, "a@example.com")

    def test_email_sai_dinh_dang(self):
        with self.assertRaises(ValidationError):
            LoginIn(email="khong-phai-email", password="x")

    def test_mat_khau_qua_ngan(self):
        with self.assertRaises(ValidationError):
            RegisterIn(email="a@b.com", password="1234567", full_name="An", role="CANDIDATE")

    def test_mat_khau_qua_dai(self):
        with self.assertRaises(ValidationError):
            RegisterIn(email="a@b.com", password="x" * 73, full_name="An", role="CANDIDATE")

    def test_ho_ten_rong(self):
        with self.assertRaises(ValidationError):
            RegisterIn(email="a@b.com", password="12345678", full_name="   ", role="CANDIDATE")

    def test_dat_lai_mat_khau_qua_ngan(self):
        with self.assertRaises(ValidationError):
            ResetPasswordIn(token="t", new_password="123")

    def test_user_out_tu_user(self):
        out = UserOut.from_user(_FakeUser)
        self.assertEqual(out.role, "CANDIDATE")
        self.assertFalse(out.email_verified)


if __name__ == "__main__":
    unittest.main()
