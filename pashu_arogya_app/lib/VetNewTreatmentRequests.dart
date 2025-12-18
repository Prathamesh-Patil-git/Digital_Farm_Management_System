import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'VetDiagnoseTreatment.dart';

class VetNewTreatmentRequests extends StatefulWidget {
  final String vetToken;
  const VetNewTreatmentRequests({
    super.key,
    required this.vetToken,
  });

  @override
  State<VetNewTreatmentRequests> createState() =>
      _VetNewTreatmentRequestsState();
}

class _VetNewTreatmentRequestsState extends State<VetNewTreatmentRequests> {
  bool loading = true;
  List treatments = [];

  final String baseUrl = "http://10.192.26.46:5000";

  @override
  void initState() {
    super.initState();
    fetchPendingTreatments();
  }

  Future<void> fetchPendingTreatments() async {
    try {
      final res = await http.get(
        Uri.parse("$baseUrl/treatments/pending"),
        headers: {
          "Authorization": "Bearer ${widget.vetToken}",
        },
      );

      final decoded = jsonDecode(res.body);

      setState(() {
        treatments = (decoded["data"] as List)
            .where((t) => t["status"] == "pending")
            .toList();
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("New Treatment Requests")),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : treatments.isEmpty
              ? const Center(child: Text("No pending requests"))
              : ListView.builder(
                  itemCount: treatments.length,
                  itemBuilder: (_, i) {
                    final t = treatments[i];
                    return Card(
                      margin: const EdgeInsets.all(10),
                      child: ListTile(
                        title: Text(t["diagnosis"]),
                        subtitle: Text(
                          "Symptoms: ${t["symptoms"].join(", ")}",
                        ),
                        trailing: const Icon(Icons.arrow_forward),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => VetDiagnoseTreatment(
                                vetToken: widget.vetToken,
                                treatmentId: t["_id"],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
