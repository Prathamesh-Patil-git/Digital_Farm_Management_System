import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/token_storage.dart';

class TreatmentPage extends StatefulWidget {
  const TreatmentPage({super.key});

  @override
  State<TreatmentPage> createState() => _TreatmentPageState();
}

class _TreatmentPageState extends State<TreatmentPage> {
  final String baseUrl = "http://10.19.169.17:5000";

  bool loading = false;
  List animals = [];
  List treatments = [];
  Map<dynamic, dynamic>? selectedAnimal;

  // ================= AUTH HEADER =================
  Future<Map<String, String>> authHeader() async {
    final token = await TokenStorage.getToken();
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    };
  }

  // ================= GET MY ANIMALS =================
  Future<void> getMyAnimals() async {
    setState(() => loading = true);

    final res = await http.get(
      Uri.parse("$baseUrl/animals/mine"),
      headers: await authHeader(),
    );

    final decoded = jsonDecode(res.body);

    setState(() {
      animals = decoded["data"] ?? [];
      treatments = [];
      selectedAnimal = null;
      loading = false;
    });
  }

  // ================= GET TREATMENTS BY ANIMAL =================
  Future<void> getTreatments() async {
    if (selectedAnimal == null) return;

    setState(() => loading = true);

    final res = await http.get(
      Uri.parse("$baseUrl/treatments/animal/${selectedAnimal!["_id"]}"),
      headers: await authHeader(),
    );

    final decoded = jsonDecode(res.body);

    setState(() {
      treatments = decoded["data"] ?? [];
      loading = false;
    });
  }

  // ================= CREATE TREATMENT REQUEST =================
  void showCreateTreatmentForm() {
    if (selectedAnimal == null) return;

    final symptomsCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final medicinesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  "New Treatment Request",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),

                _input(symptomsCtrl, "Symptoms (comma separated)"),
                _input(notesCtrl, "Notes"),
                _input(medicinesCtrl, "Medicines (comma separated)"),

                const SizedBox(height: 16),

                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);

                    await createTreatmentRequest(
                      symptomsCtrl.text
                          .split(",")
                          .map((e) => e.trim())
                          .where((e) => e.isNotEmpty)
                          .toList(),
                      notesCtrl.text,
                      medicinesCtrl.text
                          .split(",")
                          .map((e) => e.trim())
                          .where((e) => e.isNotEmpty)
                          .toList(),
                    );
                  },
                  child: const Text("SUBMIT REQUEST"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> createTreatmentRequest(
      List<String> symptoms,
      String notes,
      List<String> medicines,
      ) async {
    setState(() => loading = true);

    final res = await http.post(
      Uri.parse("$baseUrl/treatments/request"),
      headers: await authHeader(),
      body: jsonEncode({
        "animal_id": selectedAnimal!["_id"],
        "symptoms": symptoms,
        "notes": notes,
        "medicines": medicines,
      }),
    );

    setState(() => loading = false);

    final decoded = jsonDecode(res.body);

    if (decoded["status"] == "success") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✅ Treatment request created")),
      );
      await getTreatments();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(decoded["message"] ?? "❌ Failed")),
      );
    }
  }

  // ================= VIEW SINGLE TREATMENT =================
  void viewTreatment(Map<String, dynamic> t) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Treatment Details"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Status: ${t["status"]}"),
            const SizedBox(height: 6),
            Text("Symptoms: ${(t["symptoms"] ?? []).join(", ")}"),
            if (t["notes"] != null && t["notes"].toString().isNotEmpty)
              Text("Notes: ${t["notes"]}"),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("OK"),
          )
        ],
      ),
    );
  }

  // ================= ANIMAL EMOJI =================
  String animalEmoji(String species) {
    switch (species) {
      case "cow":
        return "🐄";
      case "buffalo":
        return "🐃";
      case "goat":
        return "🐐";
      case "sheep":
        return "🐑";
      case "poultry":
        return "🐔";
      default:
        return "🐾";
    }
  }

  // ================= ANIMAL CARD =================
  Widget animalCard(Map a) {
    final bool selected = selectedAnimal?["_id"] == a["_id"];

    return InkWell(
      onTap: () {
        setState(() => selectedAnimal = a);
        getTreatments();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? const Color(0xFF2E7D32) : Colors.grey.shade300,
            width: 2,
          ),
          boxShadow: const [
            BoxShadow(color: Colors.black12, blurRadius: 4),
          ],
        ),
        child: Row(
          children: [
            Container(
              height: 48,
              width: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFFF6F00),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  animalEmoji(a["species"]),
                  style: const TextStyle(fontSize: 28),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    a["species"].toString().toUpperCase(),
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text("Tag: ${a["tag_number"]}"),
                ],
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle, color: Colors.green),
          ],
        ),
      ),
    );
  }

  // ================= TREATMENT CARD =================
  Widget treatmentCard(Map t) {
    final status = t["status"] ?? "unknown";

    Color statusColor = status == "pending"
        ? Colors.orange
        : status == "diagnosed"
        ? Colors.green
        : Colors.grey;

    return InkWell(
      onTap: () => viewTreatment(Map<String, dynamic>.from(t)),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: statusColor, width: 2),
          boxShadow: const [
            BoxShadow(color: Colors.black12, blurRadius: 4),
          ],
        ),
        child: Row(
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.medical_services, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Treatment",
                    style:
                    TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  Text("Status: $status",
                      style: TextStyle(color: statusColor)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16),
          ],
        ),
      ),
    );
  }

  // ================= UI =================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Treatment Management"),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: getMyAnimals,
                    child: const Text("My Animals"),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed:
                    selectedAnimal == null ? null : showCreateTreatmentForm,
                    child: const Text("New Treatment"),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            if (loading) const CircularProgressIndicator(),

            if (animals.isNotEmpty)
              Expanded(
                child: ListView.builder(
                  itemCount: animals.length,
                  itemBuilder: (_, i) => animalCard(animals[i]),
                ),
              ),

            if (selectedAnimal != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(top: 8, bottom: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFE0B2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "Treatments for ${selectedAnimal!["species"].toString().toUpperCase()}",
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),

            if (treatments.isNotEmpty)
              Expanded(
                child: ListView.builder(
                  itemCount: treatments.length,
                  itemBuilder: (_, i) => treatmentCard(treatments[i]),
                ),
              ),

            if (selectedAnimal != null && treatments.isEmpty && !loading)
              const Padding(
                padding: EdgeInsets.only(top: 20),
                child: Text(
                  "No treatments found for this animal",
                  style: TextStyle(color: Colors.grey),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ================= INPUT =================
  Widget _input(TextEditingController c, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: c,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
