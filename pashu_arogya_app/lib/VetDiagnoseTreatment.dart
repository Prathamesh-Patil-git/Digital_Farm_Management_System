import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class VetDiagnoseTreatment extends StatefulWidget {
  final String vetToken;
  final String treatmentId;

  const VetDiagnoseTreatment({
    super.key,
    required this.vetToken,
    required this.treatmentId,
  });

  @override
  State<VetDiagnoseTreatment> createState() => _VetDiagnoseTreatmentState();
}

class _VetDiagnoseTreatmentState extends State<VetDiagnoseTreatment> {
  final TextEditingController medicineCtrl = TextEditingController();
  final TextEditingController dosageCtrl = TextEditingController();
  final TextEditingController withdrawalCtrl = TextEditingController();
  final TextEditingController notesCtrl = TextEditingController();

  bool loading = false;
  final String baseUrl = "http://10.19.169.46:5000";

  Future<void> submitDiagnosis() async {
    setState(() => loading = true);

    final body = {
      "medicines": [
        {
          "name": medicineCtrl.text,
          "dosage": dosageCtrl.text,
          "withdrawal_period_days":
              int.parse(withdrawalCtrl.text),
        }
      ],
      "notes": notesCtrl.text,
    };

    final res = await http.put(
      Uri.parse(
        "$baseUrl/treatments/${widget.treatmentId}/diagnose",
      ),
      headers: {
        "Authorization": "Bearer ${widget.vetToken}",
        "Content-Type": "application/json",
      },
      body: jsonEncode(body),
    );

    setState(() => loading = false);

    if (res.statusCode == 200) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Diagnose Treatment")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(decoration: const InputDecoration(labelText: "Medicine"), controller: medicineCtrl),
            TextField(decoration: const InputDecoration(labelText: "Dosage"), controller: dosageCtrl),
            TextField(decoration: const InputDecoration(labelText: "Withdrawal Days"), controller: withdrawalCtrl, keyboardType: TextInputType.number),
            TextField(decoration: const InputDecoration(labelText: "Notes"), controller: notesCtrl),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: loading ? null : submitDiagnosis,
              child: loading
                  ? const CircularProgressIndicator()
                  : const Text("Submit Diagnosis"),
            ),
          ],
        ),
      ),
    );
  }
}
