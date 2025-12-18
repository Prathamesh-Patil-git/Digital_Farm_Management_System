import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import 'Vet_Register.dart';
import 'VetDashboard.dart';

class VetForm extends StatefulWidget {
  const VetForm({super.key});

  @override
  State<VetForm> createState() => _VetFormState();
}

class _VetFormState extends State<VetForm>
    with SingleTickerProviderStateMixin {

  // 🎬 Animation
  late AnimationController _controller;
  late Animation<double> fadeAnim;

  // 🧠 Controllers
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController otpController = TextEditingController();

  // 🧾 State
  bool showOtpField = false;
  bool loading = false;
  String apiResponse = "";

  // 🌐 Backend
  final String baseUrl = "http://10.19.169.46:5000";

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    fadeAnim = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
  }

  // =======================
  // 📤 SEND OTP
  // =======================
  Future<void> sendOtp() async {
    if (mobileController.text.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter valid 10 digit mobile number")),
      );
      return;
    }

    setState(() {
      loading = true;
      apiResponse = "";
    });

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/veterinarian/auth/login/send-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"mobile": mobileController.text}),
      ).timeout(const Duration(seconds: 10));

      setState(() {
        loading = false;
        showOtpField = true;
        apiResponse = response.body;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✅ OTP sent")),
      );
    } catch (e) {
      setState(() {
        loading = false;
        apiResponse = "❌ Server not reachable\n$e";
      });
    }
  }

  // =======================
  // ✅ VERIFY OTP
  // =======================
  Future<void> verifyOtp() async {
    if (otpController.text.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter 6 digit OTP")),
      );
      return;
    }

    setState(() => loading = true);

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/veterinarian/auth/login/verify-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "mobile": mobileController.text,
          "otp_code": otpController.text,
        }),
      ).timeout(const Duration(seconds: 10));

      final decoded = jsonDecode(response.body);

      setState(() {
        loading = false;
        apiResponse = response.body;
      });

      if (decoded["status"] != "success") {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("❌ OTP verification failed")),
        );
        return;
      }

      final data = decoded["data"];

      // =========================
      // 👤 EXISTING VET → DASHBOARD
      // =========================
      if (data.containsKey("access_token")) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => VetDashboard(vetToken: data["access_token"])),
        );
        return;
      }

      // =========================
      // 🆕 NEW VET → REGISTRATION
      // =========================
      if (data.containsKey("temp_token")) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) =>
                VetRegistrationForm(tempToken: data["temp_token"]),
          ),
        );
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Invalid server response")),
      );
    } catch (e) {
      setState(() {
        loading = false;
        apiResponse = "❌ Server not reachable\n$e";
      });
    }
  }

  // =======================
  // 🖥️ UI
  // =======================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Veterinarian Mobile Verification"),
        centerTitle: true,
        foregroundColor: Colors.white,
      ),
      body: FadeTransition(
        opacity: fadeAnim,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: ListView(
            children: [

              _title("Enter Mobile Number"),

              TextField(
                controller: mobileController,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                decoration: _field("Mobile Number"),
              ),

              if (showOtpField) ...[
                const SizedBox(height: 20),
                _title("Enter OTP"),
                TextField(
                  controller: otpController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  decoration: _field("6 Digit OTP"),
                ),
              ],

              const SizedBox(height: 25),

              InkWell(
                onTap: loading
                    ? null
                    : showOtpField
                        ? verifyOtp
                        : sendOtp,
                child: _button(
                  loading
                      ? "Please wait..."
                      : showOtpField
                          ? "VERIFY OTP"
                          : "GET OTP",
                ),
              ),

              const SizedBox(height: 25),

              if (apiResponse.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF2E7D32)),
                  ),
                  child: Text(apiResponse),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // =======================
  // 🎨 Helpers
  // =======================
  Widget _title(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E7D32),
          ),
        ),
      );

  InputDecoration _field(String label) => InputDecoration(
        filled: true,
        fillColor: Colors.white,
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      );

  Widget _button(String text) => Container(
        height: 55,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: const LinearGradient(
            colors: [Color(0xFF2E7D32), Color(0xFFFF6F00)],
          ),
        ),
        child: Center(
          child: loading
              ? const CircularProgressIndicator(color: Colors.white)
              : Text(
                  text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      );
}
