import 'package:flutter/material.dart';

class VetTreatmentHistory extends StatelessWidget {
  final String vetToken;
  const VetTreatmentHistory({
    super.key,
    required this.vetToken,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Treatment History"),
      ),
      body: const Center(
        child: Text("Treatment History Screen"),
      ),
    );
  }
}