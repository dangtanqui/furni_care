import 'package:json_annotation/json_annotation.dart';

part 'auth_models.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String email;
  final String name;
  final String role;
  
  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
  });
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class LoginRequest {
  final String email;
  final String password;
  @JsonKey(name: 'remember_me')
  final bool rememberMe;
  
  LoginRequest({
    required this.email,
    required this.password,
    required this.rememberMe,
  });
  
  factory LoginRequest.fromJson(Map<String, dynamic> json) => _$LoginRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}

@JsonSerializable()
class LoginResponse {
  final String token;
  final User user;
  
  LoginResponse({
    required this.token,
    required this.user,
  });
  
  factory LoginResponse.fromJson(Map<String, dynamic> json) => _$LoginResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}

@JsonSerializable()
class GetMeResponse {
  final User user;
  
  GetMeResponse({
    required this.user,
  });
  
  factory GetMeResponse.fromJson(Map<String, dynamic> json) => _$GetMeResponseFromJson(json);
  Map<String, dynamic> toJson() => _$GetMeResponseToJson(this);
}

