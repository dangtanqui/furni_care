import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/text_field.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  bool _rememberMe = false;
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _loadRememberedEmail();
  }
  
  Future<void> _loadRememberedEmail() async {
    final rememberedEmail = await SecureStorage.getRememberedEmail();
    if (rememberedEmail != null) {
      setState(() {
        _emailController.text = rememberedEmail;
        _rememberMe = true;
      });
    }
  }
  
  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _errorMessage = null;
    });
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
        _rememberMe,
      );
      
      if (mounted) {
        // Navigation will be handled by router
      }
    } catch (e) {
      if (mounted) {
        final error = e is AppError ? e : AppError.fromException(e as Exception);
        
        // Check if it's a rate limit error
        if (error.statusCode == 429 || 
            error.message.toLowerCase().contains('too many') ||
            error.message.toLowerCase().contains('rate limit')) {
          setState(() {
            _errorMessage = error.message;
          });
        } else {
          setState(() {
            _errorMessage = 'Invalid email or password';
          });
        }
      }
    }
  }
  
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    // Redirect if already authenticated
    if (authProvider.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        // Navigation handled by router
      });
    }
    
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1e3a5f),
              Color(0xFF0d9488),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Logo and Title
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.chair,
                              size: 40,
                              color: Color(0xFF0d9488),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'FurniCare',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1e3a5f),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Warranty Management System',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 32),
                        
                        // Error message
                        if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.error_outline,
                                  color: Colors.red.shade700,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: TextStyle(
                                      color: Colors.red.shade700,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        
                        // Email field
                        AppTextField(
                          label: 'Email',
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          enabled: !authProvider.isLoading,
                        ),
                        const SizedBox(height: 16),
                        
                        // Password field
                        AppTextField(
                          label: 'Password',
                          controller: _passwordController,
                          obscureText: !_showPassword,
                          enabled: !authProvider.isLoading,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _showPassword ? Icons.visibility_off : Icons.visibility,
                              color: Colors.grey,
                            ),
                            onPressed: () {
                              setState(() {
                                _showPassword = !_showPassword;
                              });
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Remember me checkbox
                        Row(
                          children: [
                            Checkbox(
                              value: _rememberMe,
                              onChanged: authProvider.isLoading
                                  ? null
                                  : (value) {
                                      setState(() {
                                        _rememberMe = value ?? false;
                                      });
                                    },
                            ),
                            const Text('Remember Me'),
                          ],
                        ),
                        const SizedBox(height: 24),
                        
                        // Login button
                        AppButton(
                          text: 'Login',
                          onPressed: _handleLogin,
                          variant: ButtonVariant.primary,
                          isLoading: authProvider.isLoading,
                        ),
                        const SizedBox(height: 24),
                        
                        // Demo info
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Demo accounts:',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'cs@demo.com | tech@demo.com | leader@demo.com',
                                style: TextStyle(fontSize: 12),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Password: password',
                                style: TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

