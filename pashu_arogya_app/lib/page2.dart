import 'package:flutter/material.dart';
import 'farmer_form.dart';
import 'Vet_Register.dart';
import 'customer_form.dart';
import 'VetForm.dart';


class NextPage extends StatefulWidget {
  const NextPage({super.key});

  @override
  State<NextPage> createState() => _NextPageState();
}

class _NextPageState extends State<NextPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> fadeFarmer;
  late Animation<double> fadeVet;
  late Animation<double> fadeCustomer;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500), // a bit faster
    );

    fadeFarmer = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.3, curve: Curves.easeIn),
    );

    fadeVet = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.25, 0.65, curve: Curves.easeIn),
    );

    fadeCustomer = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.55, 1.0, curve: Curves.easeIn),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget buildIconCard(String img, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: AnimatedScale(
        scale: 1.0,
        duration: const Duration(milliseconds: 200),
        child: Container(
          width: 260,
          padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(25),
            color: Colors.white.withOpacity(0.75),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 15,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                height: 80,
                width: 80,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade100,
                  shape: BoxShape.circle,
                ),
                child: Image.asset(img),
              ),

              const SizedBox(height: 14),

              Text(
                label,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFF3E0), // Light Orange
              Color(0xFFFFFFFF),
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                "Select User Type",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),

              const SizedBox(height: 40),

              FadeTransition(
                opacity: fadeFarmer,
                child: buildIconCard("assets/images/farmer.png", "Farmer", () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const FarmerForm()),
                  );
                }),
              ),

              const SizedBox(height: 20),

              FadeTransition(
                opacity: fadeVet,
                child: buildIconCard(
                  "assets/images/vet.png",
                  "Veterinarian",
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => VetForm()),
                    );
                  },
                ),
              ),

              const SizedBox(height: 20),

              FadeTransition(
                opacity: fadeCustomer,
                child: buildIconCard("assets/images/cons.png", "Customer", () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CustomerForm()),
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
