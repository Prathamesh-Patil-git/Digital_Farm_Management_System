import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/token_storage.dart';

class AnimalFeaturePage extends StatefulWidget {
  const AnimalFeaturePage({super.key});

  @override
  State<AnimalFeaturePage> createState() => _AnimalFeaturePageState();
}

class _AnimalFeaturePageState extends State<AnimalFeaturePage> {
  final String baseUrl = "http://10.19.169.17:5000";

  bool loading = false;
  List animals = [];
  Map<dynamic, dynamic>? selectedAnimal;


  void showUpdateAnimalForm(Map<String, dynamic> animal) {
    String species = animal["species"] ?? "cow";
    String gender = animal["gender"] ?? "female";
    String pregnancyStatus = animal["pregnancy_status"] ?? "unknown";
    bool isLactating = animal["is_lactating"] ?? false;

    final breedCtrl =
    TextEditingController(text: animal["breed"] ?? "");
    final ageCtrl =
    TextEditingController(text: animal["age"]?.toString() ?? "");
    final weightCtrl =
    TextEditingController(text: animal["weight"]?.toString() ?? "");
    final milkCtrl =
    TextEditingController(text: animal["daily_milk_yield"]?.toString() ?? "");

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [

                  const Text(
                    "Update Animal",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // 🐄 SPECIES
                  DropdownButtonFormField<String>(
                    value: species,
                    decoration: _dropdownDecoration("Species"),
                    items: const [
                      DropdownMenuItem(value: "cow", child: Text("🐄 Cow")),
                      DropdownMenuItem(value: "buffalo", child: Text("🐃 Buffalo")),
                      DropdownMenuItem(value: "goat", child: Text("🐐 Goat")),
                      DropdownMenuItem(value: "sheep", child: Text("🐑 Sheep")),
                      DropdownMenuItem(value: "poultry", child: Text("🐔 Poultry")),
                    ],
                    onChanged: (v) => setDialogState(() => species = v!),
                  ),

                  _input(breedCtrl, "Breed"),

                  // ⚥ GENDER
                  DropdownButtonFormField<String>(
                    value: gender,
                    decoration: _dropdownDecoration("Gender"),
                    items: const [
                      DropdownMenuItem(value: "male", child: Text("Male")),
                      DropdownMenuItem(value: "female", child: Text("Female")),
                    ],
                    onChanged: (v) => setDialogState(() => gender = v!),
                  ),

                  _input(ageCtrl, "Age"),
                  _input(weightCtrl, "Weight (kg)"),

                  // 🥛 LACTATING
                  SwitchListTile(
                    title: const Text("Is Lactating"),
                    value: isLactating,
                    onChanged: (v) {
                      setDialogState(() {
                        isLactating = v;
                      });
                    },
                  ),


                  _input(milkCtrl, "Daily Milk Yield (litres)"),

                  // 🤰 PREGNANCY
                  DropdownButtonFormField<String>(
                    value: pregnancyStatus,
                    decoration: _dropdownDecoration("Pregnancy Status"),
                    items: const [
                      DropdownMenuItem(value: "unknown", child: Text("Unknown")),
                      DropdownMenuItem(value: "pregnant", child: Text("Pregnant")),
                      DropdownMenuItem(value: "open", child: Text("Open")),
                      DropdownMenuItem(value: "dry", child: Text("Dry")),
                    ],
                    onChanged: (v) =>
                        setDialogState(() => pregnancyStatus = v!),
                  ),

                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context);

                      await updateAnimalFromForm(
                        species,
                        breedCtrl.text,
                        gender,
                        int.tryParse(ageCtrl.text),
                        int.tryParse(weightCtrl.text),
                        isLactating,
                        int.tryParse(milkCtrl.text),
                        pregnancyStatus,
                      );
                    },
                    child: const Text("UPDATE ANIMAL"),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }




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







  Future<void> updateAnimalFromForm(
      String species,
      String breed,
      String gender,
      int? age,
      int? weight,
      bool isLactating,
      int? dailyMilk,
      String pregnancyStatus,
      ) async {

    if (selectedAnimal == null) return;

    setState(() => loading = true);

    final res = await http.put(
      Uri.parse("$baseUrl/animals/${selectedAnimal!["_id"]}"),
      headers: await authHeader(),
      body: jsonEncode({
        "species": species.toLowerCase(),
        "breed": breed,
        "gender": gender,
        "age": age,
        "weight": weight,
        "is_lactating": isLactating,
        "daily_milk_yield": dailyMilk,
        "pregnancy_status": pregnancyStatus,
      }),
    );

    setState(() => loading = false);

    final decoded = jsonDecode(res.body);

    if (decoded["status"] == "success") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✅ Animal updated successfully")),
      );
      await getMyAnimals(); // refresh list
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(decoded["message"] ?? "❌ Update failed")),
      );
    }
  }

















  // ================= AUTH HEADER =================
  Future<Map<String, String>> authHeader() async {
    final token = await TokenStorage.getToken();
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    };
  }

  // ================= ADD ANIMAL FORM =================
  void showAddAnimalForm() {
    String species = "cow";
    String gender = "female";
    String pregnancyStatus = "unknown";
    bool isLactating = false;

    final breedCtrl = TextEditingController();
    final tagCtrl = TextEditingController();
    final ageCtrl = TextEditingController();
    final weightCtrl = TextEditingController();
    final milkCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
      builder: (context, setDialogState) => Dialog(

        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                const Text(
                  "Add Animal",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                // 🐄 SPECIES DROPDOWN WITH EMOJI
                DropdownButtonFormField<String>(
                  value: species,
                  decoration: _dropdownDecoration("Species"),
                  items: const [
                    DropdownMenuItem(value: "cow", child: Text("🐄 Cow")),
                    DropdownMenuItem(value: "buffalo", child: Text("🐃 Buffalo")),
                    DropdownMenuItem(value: "goat", child: Text("🐐 Goat")),
                    DropdownMenuItem(value: "sheep", child: Text("🐑 Sheep")),
                    DropdownMenuItem(value: "poultry", child: Text("🐔 Poultry")),
                  ],
                  onChanged: (v) => species = v!,
                ),

                _input(breedCtrl, "Breed"),
                _input(tagCtrl, "Tag Number"),

                // ⚥ GENDER
                DropdownButtonFormField<String>(
                  value: gender,
                  decoration: _dropdownDecoration("Gender"),
                  items: const [
                    DropdownMenuItem(value: "male", child: Text("Male")),
                    DropdownMenuItem(value: "female", child: Text("Female")),
                  ],
                  onChanged: (v) => gender = v!,
                ),

                _input(ageCtrl, "Age"),
                _input(weightCtrl, "Weight (kg)"),

                // 🥛 LACTATING SWITCH
                SwitchListTile(
                  title: const Text("Is Lactating"),
                  value: isLactating,
                  onChanged: (v) {
                    setDialogState(() {
                      isLactating = v;
                    });
                  },
                ),

                _input(milkCtrl, "Daily Milk Yield (litres)"),

                // 🤰 PREGNANCY STATUS
                DropdownButtonFormField<String>(
                  value: pregnancyStatus,
                  decoration: _dropdownDecoration("Pregnancy Status"),
                  items: const [
                    DropdownMenuItem(value: "unknown", child: Text("Unknown")),
                    DropdownMenuItem(value: "pregnant", child: Text("Pregnant")),
                    DropdownMenuItem(value: "open", child: Text("Open (Not Pregnant)")),
                    DropdownMenuItem(value: "dry", child: Text("Dry")),


                  ],
                  onChanged: (v) => pregnancyStatus = v!,
                ),

                const SizedBox(height: 20),

                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await addAnimal(
                      species,
                      breedCtrl.text,
                      gender,
                      tagCtrl.text,
                      int.tryParse(ageCtrl.text),
                      int.tryParse(weightCtrl.text),
                      isLactating,
                      int.tryParse(milkCtrl.text),
                      pregnancyStatus,
                    );
                  },
                  child: const Text("ADD ANIMAL"),
                ),
              ],
            ),
          ),
        ),
      ),
    ));
  }

  InputDecoration _dropdownDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }



  // ================= ADD ANIMAL =================
  Future<void> addAnimal(
      String species,
      String breed,
      String gender,
      String tag,
      int? age,
      int? weight,
      bool isLactating,
      int? dailyMilk,
      String pregnancyStatus,
      ) async {
    setState(() => loading = true);

    final res = await http.post(
      Uri.parse("$baseUrl/animals/"),
      headers: await authHeader(),
      body: jsonEncode({
        "species": species,
        "breed": breed,
        "gender": gender,
        "tag_number": tag,
        "age": age,
        "weight": weight,
        "is_lactating": isLactating,
        "daily_milk_yield": dailyMilk,
        "pregnancy_status": pregnancyStatus,
      }),
    );

    setState(() => loading = false);

    final decoded = jsonDecode(res.body);

    if (decoded["status"] == "success") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✅ Animal added successfully")),
      );
      await getMyAnimals();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(decoded["message"] ?? "❌ Failed")),
      );
    }
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
      loading = false;
      animals = decoded["data"] ?? [];
      selectedAnimal = null;
    });
  }

  // ================= VIEW ANIMAL =================
  Future<void> viewAnimal() async {
    if (selectedAnimal == null) return;

    setState(() => loading = true);

    final res = await http.get(
      Uri.parse("$baseUrl/animals/${selectedAnimal!["_id"]}"),
      headers: await authHeader(),
    );

    setState(() => loading = false);

    showDialog(context: context, builder: (_) => _responseDialog(res.body));
  }

  // ================= UPDATE ANIMAL =================
  Future<void> updateAnimal() async {
    if (selectedAnimal == null) return;

    setState(() => loading = true);

    final res = await http.put(
      Uri.parse("$baseUrl/animals/${selectedAnimal!["_id"]}"),
      headers: await authHeader(),
      body: jsonEncode({
        "weight": (selectedAnimal!["weight"] ?? 0) + 10,
      }),
    );

    setState(() => loading = false);

    showDialog(context: context, builder: (_) => _responseDialog(res.body));
  }







  // ================= GRID BUTTON =================
  Widget gridButton(String title, VoidCallback onTap) {
    return InkWell(
      onTap: loading ? null : onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: const LinearGradient(
            colors: [Color(0xFF2E7D32), Color(0xFFFF6F00)],
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  // ================= ANIMAL CARD =================
  Widget animalCard(Map<dynamic, dynamic> a)
  {
    final bool selected = selectedAnimal?["_id"] == a["_id"];

    return InkWell(
      onTap: () => setState(() => selectedAnimal = a),
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
                  Text("Weight: ${a["weight"] ?? "-"} kg"),
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

  // ================= UI =================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8E1),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF6F00),
        title: const Text("Animal Features"),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              children: [
                gridButton("Add Animal", showAddAnimalForm),
                gridButton("My Animals", getMyAnimals),
                gridButton("View Animal", viewAnimal),
                gridButton(
                  "Update Animal",
                      () {
                    if (selectedAnimal == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("⚠ Please select an animal first")),
                      );
                      return;
                    }
                    showUpdateAnimalForm(
                      Map<String, dynamic>.from(selectedAnimal!),
                    );
                  },
                ),

              ],
            ),
            const SizedBox(height: 20),
            if (loading) const CircularProgressIndicator(),
            if (animals.isNotEmpty)
              Expanded(
                child: ListView.builder(
                  itemCount: animals.length,
                  itemBuilder: (_, i) => animalCard(animals[i]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ================= HELPERS =================
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

  Widget _responseDialog(String text) {
    return AlertDialog(
      title: const Text("Response"),
      content: SingleChildScrollView(child: Text(text)),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("OK"),
        )
      ],
    );
  }
}
