import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'FarmerRegistrationForm.dart';
import 'package:http/http.dart' as http;


class FarmerForm extends StatefulWidget {
  const FarmerForm({super.key});

  @override
  State<FarmerForm> createState() => _FarmerFormState();
}


class _FarmerFormState extends State<FarmerForm>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> fadeAnim;

  final TextEditingController mobileController = TextEditingController();
  final TextEditingController otpController = TextEditingController();

  bool showOtpField = false;
  String apiResponse = "";
  bool loading = false;

  // ✅ ✅ ✅ YOUR CORRECT SERVER IP + PORT
  // final String baseUrl = "http://10.49.235.7:5000";
  final String baseUrl = "http://192.168.1.206:5000";




  Future<void> loginSendOtp(String mobile) async {
    setState(() {
      loading = true;
      apiResponse = "";
      mobileController.text = mobile; // reuse existing field
    });

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"mobile": mobile}),
      );

      setState(() {
        loading = false;
        showOtpField = true; // ✅ reuse OTP field
        apiResponse = response.body;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✅ OTP sent for login")),
      );
    } catch (e) {
      setState(() {
        loading = false;
        apiResponse = "❌ Login failed\n$e";
      });
    }
  }


  void showLoginDialog() {
    final TextEditingController loginMobileController =
    TextEditingController();
    final TextEditingController loginOtpController =
    TextEditingController();

    bool otpSent = false;
    bool dialogLoading = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [

                    // ❌ CLOSE
                    Align(
                      alignment: Alignment.topRight,
                      child: InkWell(
                        onTap: () => Navigator.pop(dialogContext),
                        child: const Icon(Icons.close, color: Colors.red),
                      ),
                    ),

                    const SizedBox(height: 10),

                    const Text(
                      "Login",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2E7D32),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 📱 MOBILE
                    TextField(
                      controller: loginMobileController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      decoration: _fieldDecoration("Registered Mobile Number"),
                    ),

                    const SizedBox(height: 12),

                    // 🔐 OTP FIELD (ONLY AFTER OTP SENT)
                    if (otpSent)
                      TextField(
                        controller: loginOtpController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        decoration: _fieldDecoration("Enter OTP"),
                      ),

                    const SizedBox(height: 20),

                    InkWell(
                      onTap: dialogLoading
                          ? null
                          : () async {
                        // ✅ STRICT VALIDATION
                        if (loginMobileController.text.length != 10) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Enter valid 10 digit mobile"),
                            ),
                          );
                          return;
                        }

                        setDialogState(() {
                          dialogLoading = true;
                        });

                        // 1️⃣ SEND OTP
                        if (!otpSent) {
                          try {
                            await loginSendOtp(
                                loginMobileController.text);

                            setDialogState(() {
                              otpSent = true;
                              dialogLoading = false;
                            });
                          } catch (_) {
                            setDialogState(() {
                              dialogLoading = false;
                            });
                          }
                          return;
                        }

                        // 2️⃣ VERIFY OTP
                        if (loginOtpController.text.length != 6) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Enter valid 6 digit OTP"),
                            ),
                          );
                          setDialogState(() {
                            dialogLoading = false;
                          });
                          return;
                        }

                        // reuse main controllers
                        mobileController.text =
                            loginMobileController.text;
                        otpController.text =
                            loginOtpController.text;

                        Navigator.pop(dialogContext);
                        await verifyOtp(); // ✅ SAME VERIFY LOGIC
                      },
                      child: Container(
                        height: 50,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF2E7D32),
                              Color(0xFFFF6F00),
                            ],
                          ),
                        ),
                        child: Center(
                          child: dialogLoading
                              ? const CircularProgressIndicator(
                            color: Colors.white,
                          )
                              : Text(
                            otpSent
                                ? "VERIFY OTP"
                                : "SEND OTP",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }






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

  // ✅ ✅ ✅ SEND OTP API
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
      final response = await http
          .post(
        Uri.parse("$baseUrl/auth/send-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"mobile": mobileController.text}),
      )
          .timeout(const Duration(seconds: 10));

      setState(() {
        showOtpField = true;
        loading = false;
        apiResponse = response.body;
      });
    } catch (e) {
      setState(() {
        loading = false;
        apiResponse = "❌ Server not reachable\n$e";
      });
    }
  }

  // ✅ ✅ ✅ VERIFY OTP API
  Future<void> verifyOtp() async {
    if (otpController.text.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter 6 digit OTP")),
      );
      return;
    }

    setState(() {
      loading = true;
    });

    try {
      final response = await http
          .post(
        Uri.parse("$baseUrl/auth/verify-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "mobile": mobileController.text,
          "otp_code": otpController.text, // ✅ as per your backend
        }),
      )
          .timeout(const Duration(seconds: 10));

      final decoded = jsonDecode(response.body);

      setState(() {
        loading = false;
        apiResponse = response.body;
      });

      // ✅ ✅ ✅ CHECK SUCCESS & NAVIGATE
      if (decoded["status"] == "success" &&
          decoded["data"]["otp_verified"] == true) {

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("✅ OTP Verified Successfully")),
        );

        final String tempToken = decoded["data"]["temp_token"];
        // ✅ ✅ ✅ OPEN FARMER REGISTRATION PAGE
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => FarmerRegistrationForm(tempToken: tempToken),
          ),

        );




      }
      else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("❌ OTP Verification Failed")),
        );
      }

    } catch (e) {
      setState(() {
        loading = false;
        apiResponse = "❌ Server not reachable\n$e";
      });
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1), // light saffron
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00), // orange
        title: const Text("Farmer Mobile Verification"),
        centerTitle: true,
        foregroundColor: Colors.white,
      ),

      body: FadeTransition(
        opacity: fadeAnim,
        child: Padding(
          padding: const EdgeInsets.all(18.0),
          child: ListView(
            children: [
              const SizedBox(height: 10),

              _title("Enter Mobile Number"),

              // ✅ ✅ ✅ MOBILE NUMBER FIELD (10 DIGITS)
              TextField(
                controller: mobileController,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                decoration: _fieldDecoration("Mobile Number"),
              ),

              const SizedBox(height: 20),

              // ✅ ✅ ✅ OTP FIELD (SHOWS AFTER SEND OTP)
              if (showOtpField) ...[
                _title("Enter OTP"),
                TextField(
                  controller: otpController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  decoration: _fieldDecoration("6 Digit OTP"),
                ),
                const SizedBox(height: 20),
              ],

              // ✅ ✅ ✅ DYNAMIC BUTTON
              InkWell(
                onTap: loading ? null : showOtpField ? verifyOtp : sendOtp,
                child: Container(
                  height: 55,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF2E7D32), // Green
                        Color(0xFFFF6F00), // Orange
                      ],
                    ),
                  ),
                  child: Center(
                    child: loading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                      showOtpField ? "VERIFY OTP" : "GET OTP",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),



              const SizedBox(height: 12),

              InkWell(
                onTap: loading ? null : showLoginDialog,
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF2E7D32),
                        Color(0xFFFF6F00),
                      ],
                    ),
                  ),
                  child: const Center(
                    child: Text(
                      "Already have an account?",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),



              const SizedBox(height: 25),

              // ✅ ✅ ✅ API RESPONSE DISPLAY
              if (apiResponse.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border:
                    Border.all(color: const Color(0xFF2E7D32)),
                  ),
                  child: Text(
                    apiResponse,
                    style: const TextStyle(fontSize: 14),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _title(String text) {
    return Padding(
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
  }

  InputDecoration _fieldDecoration(String label) {
    return InputDecoration(
      filled: true,
      fillColor: Colors.white,
      labelText: label,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}
