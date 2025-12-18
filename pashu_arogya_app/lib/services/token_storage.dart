import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static final _storage = FlutterSecureStorage();

  // ✅ Save token (LIKE COOKIE)
  static Future<void> saveToken(String token) async {
    await _storage.write(key: "access_token", value: token);
  }

  // ✅ Read token (AUTO LOGIN)
  static Future<String?> getToken() async {
    return await _storage.read(key: "access_token");
  }

  // ✅ Logout (DELETE)
  static Future<void> clearToken() async {
    await _storage.delete(key: "access_token");
  }
}
