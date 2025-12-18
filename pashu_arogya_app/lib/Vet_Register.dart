import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:geolocator/geolocator.dart';

class VetRegistrationForm extends StatefulWidget {
  final String tempToken;
  const VetRegistrationForm({super.key, required this.tempToken});

  @override
  State<VetRegistrationForm> createState() => _VetRegistrationFormState();
}

class _VetRegistrationFormState extends State<VetRegistrationForm>
    with SingleTickerProviderStateMixin {

  late AnimationController _controller;
  late Animation<double> fadeAnim;

  final nameController = TextEditingController();
  final ageController = TextEditingController();
  final addressController = TextEditingController();
  final experienceController = TextEditingController();
  final qualificationController = TextEditingController();
  final specializationController = TextEditingController();
  final clinicNameController = TextEditingController();
  final clinicAddressController = TextEditingController();
  final regNumberController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  String? selectedGender;
  double? gpsLat, gpsLng;

  // final String baseUrl = "http://127.0.0.1:5000";
  final String baseUrl = "http://10.19.169.46:5000";

  // FILES
  File? idProofFile;
  File? selfPhotoFile;
  File? licenseFile;

  bool idUploaded = false;
  bool photoUploaded = false;
  bool licenseUploaded = false;

  bool idError = false;
  bool photoError = false;
  bool licenseError = false;

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

  Future<void> pickDocument(Function(File) setFile) async {
    final result = await FilePicker.platform.pickFiles();
    if (result != null && result.files.single.path != null) {
      setFile(File(result.files.single.path!));
    }
  }

  Future<void> uploadSingleFile(
    File file,
    String label,
    Function(bool) setSuccess,
    Function(bool) setError,
  ) async {
    try {
      final uri = Uri.parse("$baseUrl/uploads/vet");
      final request = http.MultipartRequest("POST", uri);

      request.headers['Authorization'] = "Bearer ${widget.tempToken}";

      final mimeType = lookupMimeType(file.path)!;
      final split = mimeType.split('/');

      request.files.add(
        await http.MultipartFile.fromPath(
          "file",
          file.path,
          contentType: MediaType(split[0], split[1]),
        ),
      );

      final response = await request.send();
      final body = await response.stream.bytesToString();
      final decoded = jsonDecode(body);

      if (response.statusCode == 200 && decoded["status"] == "success") {
        setState(() {
          setSuccess(true);
          setError(false);
        });
      } else {
        throw decoded["message"];
      }
    } catch (e) {
      setState(() {
        setSuccess(false);
        setError(true);
      });
    }
  }

  Future<void> detectGPS() async {
    await Geolocator.requestPermission();
    final pos = await Geolocator.getCurrentPosition();
    setState(() {
      gpsLat = pos.latitude;
      gpsLng = pos.longitude;
    });
  }

  Future<void> submitVet() async {
    setState(() => isSubmitting = true);

    if (
      nameController.text.isEmpty ||
      selectedGender == null ||
      gpsLat == null ||
      !idUploaded ||
      !photoUploaded ||
      !licenseUploaded
    ) {
      setState(() => isSubmitting = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text("❌ Complete all steps")));
      return;
    }

    final response = await http.post(
      Uri.parse("$baseUrl/veterinarian/auth/register"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${widget.tempToken}",
      },
      body: jsonEncode({
        "name": nameController.text,
        "age": int.parse(ageController.text),
        "gender": selectedGender,
        "address": addressController.text,
        "experience": experienceController.text,
        "qualification": qualificationController.text,
        "specialization": specializationController.text,
        "clinic_name": clinicNameController.text,
        "clinic_address": clinicAddressController.text,
        "registration_number": regNumberController.text,
        "email": emailController.text,
        "password": passwordController.text,
        "gps_location": {"lat": gpsLat, "lng": gpsLng},
      }),
    );

    print(response.body);
    print(response);

    final decoded = jsonDecode(response.body);

    if (decoded["status"] == "success") {
      Navigator.pushReplacementNamed(context, "/vet-dashboard");
    } else {
      setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        title: const Text("Veterinarian Registration"),
        backgroundColor: const Color(0xFFFF6F00),
      ),
      body: FadeTransition(
        opacity: fadeAnim,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [

            _section("Personal Details"),
            _input("Name", nameController),
            _input("Age", ageController),
            _dropdown(),

            _section("Professional Details"),
            _input("Experience (Years)", experienceController),
            _input("Qualifications",qualificationController ),
            _input("Specialization", specializationController),
            _input("Registration Number", regNumberController),
            _input("Clinic Name", clinicNameController),
            _input("Clinic Address", clinicAddressController),

            _section("Verification"),
            _uploadRow("Government ID", idUploaded, idError, () async {
              await pickDocument((f) => idProofFile = f);
              uploadSingleFile(idProofFile!, "ID", (v)=>idUploaded=v,(v)=>idError=v);
            }),

            _uploadRow("Self Photo", photoUploaded, photoError, () async {
              await pickDocument((f) => selfPhotoFile = f);
              uploadSingleFile(selfPhotoFile!, "PHOTO",(v)=>photoUploaded=v,(v)=>photoError=v);
            }),

            _uploadRow("License Certificate", licenseUploaded, licenseError, () async {
              await pickDocument((f) => licenseFile = f);
              uploadSingleFile(licenseFile!, "LICENSE",(v)=>licenseUploaded=v,(v)=>licenseError=v);
            }),

            const SizedBox(height: 20),

            InkWell(
              onTap: detectGPS,
              child: _button("📍 Detect GPS"),
            ),

            const SizedBox(height: 25),

            InkWell(
              onTap: isSubmitting ? null : submitVet,
              child: _button(
                isSubmitting ? "Submitting..." : "SUBMIT REGISTRATION",
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String s) => Padding(
    padding: const EdgeInsets.only(top: 20, bottom: 10),
    child: Text(s, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
  );

  Widget _input(String label, TextEditingController c) => Padding(
    padding: const EdgeInsets.only(bottom: 15),
    child: TextField(
      controller: c,
      decoration: InputDecoration(labelText: label),
    ),
  );

  Widget _dropdown() => DropdownButtonFormField<String>(
    value: selectedGender,
    items: const [
      DropdownMenuItem(value: "male", child: Text("Male")),
      DropdownMenuItem(value: "female", child: Text("Female")),
      DropdownMenuItem(value: "other", child: Text("Other")),
    ],
    onChanged: (v) => setState(() => selectedGender = v),
    decoration: const InputDecoration(labelText: "Gender"),
  );

  Widget _uploadRow(String label, bool ok, bool err, VoidCallback onTap) {
    return ListTile(
      title: Text(label),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(icon: const Icon(Icons.upload), onPressed: onTap),
          if (ok) const Icon(Icons.check, color: Colors.green),
          if (err) const Icon(Icons.close, color: Colors.red),
        ],
      ),
    );
  }

  Widget _button(String text) => Container(
    height: 55,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(14),
      gradient: const LinearGradient(
        colors: [Color(0xFF2E7D32), Color(0xFFFF6F00)],
      ),
    ),
    child: Center(
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 18)),
    ),
  );
}
