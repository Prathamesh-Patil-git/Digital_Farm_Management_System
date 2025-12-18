import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'dart:convert';
import 'dart:io';
import 'package:geolocator/geolocator.dart';
import 'package:pashu_arogya_app/services/token_storage.dart';

import 'farmer_dashboard.dart';


class FarmerRegistrationForm extends StatefulWidget {
  final String tempToken;

  const FarmerRegistrationForm({super.key, required this.tempToken});

  @override
  State<FarmerRegistrationForm> createState() =>
      _FarmerRegistrationFormState();
}

class _FarmerRegistrationFormState extends State<FarmerRegistrationForm>
    with SingleTickerProviderStateMixin {

  late AnimationController _controller;
  late Animation<double> fadeAnim;

  final TextEditingController ageController = TextEditingController();
  final TextEditingController genderController = TextEditingController();
  final TextEditingController addressController = TextEditingController();

  final TextEditingController nameController = TextEditingController();
  final TextEditingController aadharController = TextEditingController();

  double? gpsLat;
  double? gpsLng;
  String? selectedGender;


  // final String baseUrl = "http://10.49.235.7:5000";
  final String baseUrl = "http://192.168.1.206:5000";

  // ✅ FILES
  File? farmerPhotoFile;
  File? aadharPhotoFile;
  File? tahsildarDocFile;

  // ✅ UPLOAD STATUS
  bool farmerUploaded = false;
  bool aadharUploaded = false;
  bool tahsildarUploaded = false;

  bool farmerError = false;
  bool aadharError = false;
  bool tahsildarError = false;
  bool isSubmitting = false;



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

  // ✅ PICK FILE
  Future<void> pickDocument(Function(File file) updateFile) async {
    final result = await FilePicker.platform.pickFiles();
    if (result != null && result.files.single.path != null) {
      updateFile(File(result.files.single.path!));
    }
  }

  // ✅ SINGLE FILE UPLOAD API CALL
  Future<void> uploadSingleFile(
      File file,
      String label,
      Function(bool) setSuccess,
      Function(bool) setError,
      ) async {
    try {
      final uri = Uri.parse("$baseUrl/uploads/farmer");

      var request = http.MultipartRequest("POST", uri);

      request.headers['Authorization'] =
      "Bearer ${widget.tempToken}";

      // ✅ ✅ ✅ GET CORRECT MIME TYPE
      final mimeType = lookupMimeType(file.path);

      if (mimeType == null) {
        throw "Unable to detect file type";
      }

      final typeSplit = mimeType.split('/');

      request.files.add(
        await http.MultipartFile.fromPath(
          "file",
          file.path,
          contentType: MediaType(typeSplit[0], typeSplit[1]),
        ),
      );

      final response = await request.send();
      final result = await response.stream.bytesToString();

      print("✅ $label UPLOAD RAW RESPONSE:");
      print(result);

      final decoded = jsonDecode(result);

      // ✅ ✅ ✅ STRICT SUCCESS CHECK
      if (response.statusCode == 200 &&
          decoded["status"] == "success") {

        setState(() {
          setSuccess(true);
          setError(false);
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("✅ $label Uploaded Successfully")),
        );

      }
      // ❌ FAILURE CASE
      else {
        setState(() {
          setSuccess(false);
          setError(true);
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("❌ $label Failed: ${decoded["message"]}")),
        );
      }

    } catch (e) {
      setState(() {
        setSuccess(false);
        setError(true);
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ $label Upload Error: $e")),
      );
    }
  }



  Future<void> detectGPSLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Enable GPS Location")),
      );
      return;
    }

    permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("❌ Location Permission Denied")),
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Location Permission Permanently Denied")),
      );
      return;
    }

    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    setState(() {
      gpsLat = position.latitude;
      gpsLng = position.longitude;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("✅ GPS Detected: $gpsLat , $gpsLng")),
    );
  }





  // ✅ ✅ ✅ ONLY REGISTER API ON SUBMIT

  Future<void> submitFarmerData() async {

    // ✅ START LOADER & PREVENT DOUBLE TAP
    setState(() {
      isSubmitting = true;
    });

    // ✅ FIELD VALIDATIONS
    if (nameController.text.isEmpty ||
        aadharController.text.length != 12 ||
        ageController.text.isEmpty ||
        selectedGender == null ||
        addressController.text.isEmpty ||
        gpsLat == null ||
        gpsLng == null ||
        !farmerUploaded ||
        !aadharUploaded ||
        !tahsildarUploaded) {

      setState(() {
        isSubmitting = false; // ✅ STOP LOADER
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Upload all documents & fill all fields")),
      );
      return;
    }

    // ✅ FORCE AGE TO INTEGER
    int parsedAge = int.tryParse(ageController.text) ?? -1;

    if (parsedAge <= 0) {
      setState(() {
        isSubmitting = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Age must be a valid number")),
      );
      return;
    }

    try {
      final registerResponse = await http.post(
        Uri.parse("$baseUrl/auth/register"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.tempToken}",
        },
        body: jsonEncode({
          "name": nameController.text,
          "aadhar_number": aadharController.text,
          "age": parsedAge,
          "gender": selectedGender,
          "address": addressController.text,
          "gps_location": {
            "lat": gpsLat,
            "lng": gpsLng,
          },
        }),
      );

      print("✅ REGISTER RESPONSE:");
      print(registerResponse.body);

      final decoded = jsonDecode(registerResponse.body);

      // ✅ ✅ ✅ ✅ SUCCESS BLOCK (TOKEN + NAVIGATION)
      if (decoded["status"] == "success") {
        final token = decoded["data"]["access_token"];

        // ✅ SAVE TOKEN SECURELY
        await TokenStorage.saveToken(token);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("✅ Login Session Saved")),
        );

        // ✅ ✅ ✅ OPEN FARMER DASHBOARD
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const FarmerDashboard()),
        );

        return; // ✅ STOP EXECUTION HERE
      }

      // ❌ IF BACKEND RETURNS FAILURE
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ REGISTER FAILED: ${decoded["message"] ?? "Unknown"}")),
      );

      setState(() {
        isSubmitting = false;
      });

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ REGISTER ERROR: $e")),
      );

      setState(() {
        isSubmitting = false;
      });
    }
  }






  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Farmer Registration"),
        centerTitle: true,
        foregroundColor: Colors.white,
      ),

      body: FadeTransition(
        opacity: fadeAnim,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ListView(
            children: [

              _title("Personal Details"),
              _input("Name", nameController),
              _input("Aadhar Number", aadharController),

              _title("Basic Info"),

              _input("Age", ageController),
              _input("Address", addressController),


              Padding(
                padding: const EdgeInsets.only(bottom: 15),
                child: DropdownButtonFormField<String>(
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    labelText: "Gender",
                  ),
                  value: selectedGender,
                  items: const [
                    DropdownMenuItem(value: "male", child: Text("Male")),
                    DropdownMenuItem(value: "female", child: Text("Female")),
                    DropdownMenuItem(value: "other", child: Text("Other")),
                  ],
                  onChanged: (value) {
                    setState(() {
                      selectedGender = value!;
                    });
                  },
                ),
              ),





              InkWell(
                onTap: detectGPSLocation,
                child: Container(
                  height: 55,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                    border: Border.all(color: const Color(0xFFFF6F00)),
                  ),
                  child: Center(
                    child: Text(
                      gpsLat == null ? "📍 Detect GPS Location"
                          : "✅ GPS Locked",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),


              _title("Documents"),

              _uploadRow(
                "Farmer Photo",
                farmerUploaded,
                farmerError,
                    () async {
                  await pickDocument((file) {
                    farmerPhotoFile = file;
                  });

                  if (farmerPhotoFile != null) {
                    uploadSingleFile(
                      farmerPhotoFile!,
                      "FARMER PHOTO",
                          (v) => farmerUploaded = v,
                          (v) => farmerError = v,
                    );
                  }
                },
              ),

              _uploadRow(
                "Aadhar Card Photo",
                aadharUploaded,
                aadharError,
                    () async {
                  await pickDocument((file) {
                    aadharPhotoFile = file;
                  });

                  if (aadharPhotoFile != null) {
                    uploadSingleFile(
                      aadharPhotoFile!,
                      "AADHAR PHOTO",
                          (v) => aadharUploaded = v,
                          (v) => aadharError = v,
                    );
                  }
                },
              ),

              _uploadRow(
                "Tahsildar Verification",
                tahsildarUploaded,
                tahsildarError,
                    () async {
                  await pickDocument((file) {
                    tahsildarDocFile = file;
                  });

                  if (tahsildarDocFile != null) {
                    uploadSingleFile(
                      tahsildarDocFile!,
                      "TAHSILDAR DOC",
                          (v) => tahsildarUploaded = v,
                          (v) => tahsildarError = v,
                    );
                  }
                },
              ),

              const SizedBox(height: 25),

              InkWell(
                onTap: isSubmitting ? null : submitFarmerData,
                child: Container(
                  height: 55,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2E7D32), Color(0xFFFF6F00)],
                    ),
                  ),
                  child: Center(
                    child: isSubmitting
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                      "SUBMIT REGISTRATION",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
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
      padding: const EdgeInsets.only(bottom: 10, top: 20),
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

  Widget _input(String label, TextEditingController? controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextField(
        controller: controller,
        keyboardType: label.contains("Aadhar")
            ? TextInputType.number
            : TextInputType.text,
        inputFormatters: label.contains("Aadhar")
            ? [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(12),
        ]
            : [],
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          labelText: label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  // ✅ FILE UPLOAD ROW WITH BUTTON + STATUS ICON
  Widget _uploadRow(
      String label,
      bool success,
      bool error,
      VoidCallback onUpload,
      ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Container(
        height: 55,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color(0xFFFF6F00)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [

            Expanded(
              child: Text(label,
                  style: const TextStyle(fontWeight: FontWeight.w500)),
            ),

            InkWell(
              onTap: onUpload,
              child: const Icon(Icons.cloud_upload,
                  color: Color(0xFFFF6F00)),
            ),

            const SizedBox(width: 12),

            if (success)
              const Icon(Icons.check_circle, color: Colors.green),

            if (error)
              const Icon(Icons.cancel, color: Colors.red),
          ],
        ),
      ),
    );
  }
}
