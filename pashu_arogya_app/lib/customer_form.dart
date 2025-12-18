import 'package:flutter/material.dart';

class CustomerForm extends StatefulWidget {
  const CustomerForm({super.key});

  @override
  State<CustomerForm> createState() => _CustomerFormState();
}

class _CustomerFormState extends State<CustomerForm>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> fadeAnim;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Customer Verification"),
        centerTitle: true,
        foregroundColor: Colors.white,
      ),

      body: FadeTransition(
        opacity: fadeAnim,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ListView(
            children: [
              TextField(
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  labelText: "Enter Farmer ID",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

              const SizedBox(height: 30),

              Center(
                child: Image.asset(
                  "assets/images/submit.png",
                  height: 70,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
