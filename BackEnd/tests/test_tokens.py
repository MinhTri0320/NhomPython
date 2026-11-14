import unittest

from services import tokenService


class TokenServiceTest(unittest.TestCase):
    def test_hash_on_dinh_va_dung_64_ky_tu(self):
        h = tokenService.hash_token("abc")
        self.assertEqual(h, tokenService.hash_token("abc"))
        self.assertEqual(len(h), 64)          # khớp cột CHAR(64) trong schema.sql
        self.assertNotEqual(h, tokenService.hash_token("abd"))

    def test_token_moi_khong_trung(self):
        tokens = {tokenService.new_token() for _ in range(50)}
        self.assertEqual(len(tokens), 50)
        self.assertTrue(all(len(t) >= 40 for t in tokens))


if __name__ == "__main__":
    unittest.main()
