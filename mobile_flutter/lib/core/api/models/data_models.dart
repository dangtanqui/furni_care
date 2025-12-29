import 'package:json_annotation/json_annotation.dart';

part 'data_models.g.dart';

@JsonSerializable()
class Client {
  final int id;
  final String name;
  final String code;
  
  Client({
    required this.id,
    required this.name,
    required this.code,
  });
  
  factory Client.fromJson(Map<String, dynamic> json) => _$ClientFromJson(json);
  Map<String, dynamic> toJson() => _$ClientToJson(this);
}

@JsonSerializable()
class Site {
  final int id;
  final String name;
  final String city;
  
  Site({
    required this.id,
    required this.name,
    required this.city,
  });
  
  factory Site.fromJson(Map<String, dynamic> json) => _$SiteFromJson(json);
  Map<String, dynamic> toJson() => _$SiteToJson(this);
}

@JsonSerializable()
class Contact {
  final int id;
  final String name;
  final String phone;
  final String email;
  
  Contact({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
  });
  
  factory Contact.fromJson(Map<String, dynamic> json) => _$ContactFromJson(json);
  Map<String, dynamic> toJson() => _$ContactToJson(this);
}

@JsonSerializable()
class Technician {
  final int id;
  final String name;
  
  Technician({
    required this.id,
    required this.name,
  });
  
  factory Technician.fromJson(Map<String, dynamic> json) => _$TechnicianFromJson(json);
  Map<String, dynamic> toJson() => _$TechnicianToJson(this);
}

