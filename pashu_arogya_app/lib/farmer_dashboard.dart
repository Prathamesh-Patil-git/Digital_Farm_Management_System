import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:pashu_arogya_app/page2.dart';
import '../services/token_storage.dart';

class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key});

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  // final String baseUrl = "http://10.49.235.7:5000";
  final String baseUrl = "http://192.168.1.206:5000";

  // ✅ FETCH PROFILE FROM /auth/me
  Future<void> fetchProfile() async {
    final token = await TokenStorage.getToken();

    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Session expired. Please login again")),
      );
      return;
    }

    try {
      final response = await http.get(
        Uri.parse("$baseUrl/auth/me"),
        headers: {
          "Authorization": "Bearer $token",
        },
      );

      print("PROFILE RAW RESPONSE: ${response.body}");

      final decoded = jsonDecode(response.body);

      if (decoded["status"] == "success") {
        showProfileDialog(decoded["data"]);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(decoded["message"] ?? "❌ Failed to load profile")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ Error loading profile: $e")),
      );
    }
  }


  Future<void> logout() async {
    await TokenStorage.clearToken();

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const NextPage()),
          (route) => false, // 🔥 clears back stack
    );
  }



  // ✅ PROFILE DIALOG
  void showProfileDialog(Map<String, dynamic> profile) {
    showDialog(
      context: context,
      builder: (_) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                // ❌ CLOSE BUTTON
                Align(
                  alignment: Alignment.topRight,
                  child: InkWell(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(Icons.close, color: Colors.red),
                  ),
                ),

                const SizedBox(height: 10),

                Text("👤 Name: ${profile["name"] ?? "-"}"),
                Text("🎂 Age: ${profile["age"] ?? "-"}"),
                Text("⚧ Gender: ${profile["gender"] ?? "-"}"),
                Text("🏠 Address: ${profile["address"] ?? "-"}"),

                const SizedBox(height: 10),

                if (profile["gps_location"] != null)
                  Text(
                    "📍 GPS: ${profile["gps_location"]["lat"]}, "
                        "${profile["gps_location"]["lng"]}",
                  ),

                const SizedBox(height: 20),

                // 🚪 LOGOUT BUTTON
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.logout, color: Colors.white),
                    label: const Text(
                      "LOGOUT",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () {
                      Navigator.pop(context); // close dialog
                      logout();               // logout + redirect
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }








  // ✅ CIRCULAR ACTION BUTTON
  Widget circularButton(String label, IconData icon, VoidCallback onTap) {
    return Column(
      children: [
        InkWell(
          onTap: onTap,
          child: CircleAvatar(
            radius: 35,
            backgroundColor: const Color(0xFFFF6F00),
            child: Icon(icon, color: Colors.white, size: 30),
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(

      onWillPop: () async {
        return true; // ✅ Allows app to close
      },
      child:Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),

      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Farmer Dashboard"),
        centerTitle: true,
        foregroundColor: Colors.white,

        // ✅ PROFILE ICON LEFT
        leading: IconButton(
          icon: const Icon(Icons.person),
          onPressed: fetchProfile, // ✅ CALL /auth/me
        ),
      ),

      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(

          children: [

            const SizedBox(height: 40),

            // ✅ 3 CIRCULAR BUTTONS
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [

                circularButton(
                  "Treatment",
                  Icons.healing,
                      () {
                    print("Treatment Clicked");
                  },
                ),

                circularButton(
                  "Add Animal",
                  Icons.pets,
                      () {
                    print("Add Animal Clicked");
                  },
                ),

                circularButton(
                  "Prescription",
                  Icons.description,
                      () {
                    print("Prescription Clicked");
                  },
                ),

              ],
            ),

          ],
        ),
      ),
    ));

  }
}
