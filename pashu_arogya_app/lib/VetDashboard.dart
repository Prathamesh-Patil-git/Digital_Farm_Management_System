import 'package:flutter/material.dart';
import 'VetNewTreatmentRequests.dart';
import 'VetTreatmentHistory.dart';

class VetDashboard extends StatelessWidget {
  final String vetToken; // 🔐 JWT

  const VetDashboard({
    super.key,
    required this.vetToken,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Vet Dashboard"),
        centerTitle: true,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [

            _dashboardButton(
              title: "New Treatment Requests",
              icon: Icons.assignment,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => VetNewTreatmentRequests(
                      vetToken: vetToken,
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 20),

            _dashboardButton(
              title: "Treatment History",
              icon: Icons.history,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => VetTreatmentHistory(
                      vetToken: vetToken,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // =========================
  // Dashboard Button Widget
  // =========================
  Widget _dashboardButton({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 90,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFF2E7D32), Color(0xFFFF6F00)],
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 6,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 30),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
