import unittest

from services import security
from services.errors import AppError


class SecurityTest(unittest.TestCase):
    def test_bam_va_kiem_tra_mat_khau(self):
        h = security.hash_password("Matkhau@123")
        self.assertNotEqual(h, "Matkhau@123")
        self.assertTrue(security.verify_password("Matkhau@123", h))
        self.assertFalse(security.verify_password("sai-mat-khau", h))

    def test_hash_khong_hop_le_tra_ve_false(self):
        self.assertFalse(security.verify_password("x", "khong-phai-hash"))

    def test_access_token(self):
        payload = security.decode_access_token(security.create_access_token(7, "ADMIN"))
        self.assertEqual(payload["sub"], "7")
        self.assertEqual(payload["role"], "ADMIN")

    def test_token_sai(self):
        with self.assertRaises(AppError) as ctx:
            security.decode_access_token("abc")
        self.assertEqual(ctx.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
