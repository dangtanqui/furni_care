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
  String? _emailError;
  String? _passwordError;
  
  // Static variables to persist state across widget rebuilds
  static String? _pendingErrorMessage;
  static String? _pendingEmail;
  static String? _pendingPassword;
  static bool? _pendingRememberMe;
  
  @override
  void initState() {
    super.initState();
    // Restore pending form values if widget was recreated
    // Only restore if controllers are empty (first time) or if we have pending values
    if (_pendingEmail != null && _emailController.text.isEmpty) {
      _emailController.text = _pendingEmail!;
    }
    if (_pendingPassword != null && _passwordController.text.isEmpty) {
      _passwordController.text = _pendingPassword!;
    }
    if (_pendingRememberMe != null) {
      _rememberMe = _pendingRememberMe!;
    }
    
    // Only load remembered email if we don't have pending values
    if (_pendingEmail == null) {
      _loadRememberedEmail();
    }
    
    // Restore pending error message if any
    if (_pendingErrorMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _errorMessage = _pendingErrorMessage;
            _pendingErrorMessage = null;
          });
        }
      });
    }
  }
  
  Future<void> _loadRememberedEmail() async {
    final rememberedEmail = await SecureStorage.getRememberedEmail();
    if (rememberedEmail != null && _emailController.text.isEmpty) {
      setState(() {
        _emailController.text = rememberedEmail;
        _rememberMe = true;
      });
    }
  }
  
  Future<void> _handleLogin() async {
    // Save current form values to static variables to prevent loss if widget rebuilds
    _pendingEmail = _emailController.text;
    _pendingPassword = _passwordController.text;
    _pendingRememberMe = _rememberMe;
    
    // Clear previous errors
    if (mounted) {
      setState(() {
        _errorMessage = null;
        _pendingErrorMessage = null;
        _emailError = null;
        _passwordError = null;
      });
    } else {
      _errorMessage = null;
      _pendingErrorMessage = null;
      _emailError = null;
      _passwordError = null;
    }
    
    // Validate required fields
    bool isValid = true;
    final emailValue = _emailController.text.trim();
    if (emailValue.isEmpty) {
      _emailError = 'Email is required';
      isValid = false;
    } else {
      // Validate email format
      final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
      if (!emailRegex.hasMatch(emailValue)) {
        _emailError = 'Email must be a valid email';
        isValid = false;
      }
    }
    if (_passwordController.text.isEmpty) {
      _passwordError = 'Password is required';
      isValid = false;
    }
    
    if (!isValid) {
      if (mounted) {
        setState(() {
          // Errors already set above
        });
      }
      return;
    }
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
        _rememberMe,
      );
      
      // Clear pending values only on successful login
      _pendingEmail = null;
      _pendingPassword = null;
      _pendingRememberMe = null;
      _pendingErrorMessage = null;
      
      if (mounted) {
        // Navigation will be handled by router
      }
    } catch (e) {
      // Parse error properly
      AppError error;
      if (e is AppError) {
        error = e;
      } else {
        error = AppError.fromException(e is Exception ? e : Exception(e.toString()));
      }
      
      // Set error message - form values are preserved in controllers
      String errorMsg;
      if (error.message.isNotEmpty && error.message != 'An error occurred') {
        errorMsg = error.message;
      } else if (error.statusCode == 401) {
        errorMsg = 'Invalid email or password';
      } else if (error.statusCode == 429) {
        errorMsg = 'Too many login attempts. Please try again later.';
      } else {
        errorMsg = 'An error occurred. Please try again.';
      }
      
      // Store error message in static variable to persist across widget rebuilds
      _pendingErrorMessage = errorMsg;
      _errorMessage = errorMsg;
      
      // Restore form values from static variables in case widget was rebuilt
      if (_pendingEmail != null) {
        _emailController.text = _pendingEmail!;
      }
      if (_pendingPassword != null) {
        _passwordController.text = _pendingPassword!;
      }
      if (_pendingRememberMe != null) {
        _rememberMe = _pendingRememberMe!;
      }
      
      // Try to set immediately if mounted
      if (mounted) {
        setState(() {
          _errorMessage = errorMsg;
        });
      } else {
        // Schedule setState for next frame
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted && _pendingErrorMessage != null) {
            setState(() {
              _errorMessage = _pendingErrorMessage;
              // Restore form values again in case widget was recreated
              if (_pendingEmail != null) {
                _emailController.text = _pendingEmail!;
              }
              if (_pendingPassword != null) {
                _passwordController.text = _pendingPassword!;
              }
              if (_pendingRememberMe != null) {
                _rememberMe = _pendingRememberMe!;
              }
            });
          }
        });
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
                              Icons.chair_outlined,
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
                        
                        // Error message - show at top for visibility
                        if (_errorMessage != null && _errorMessage!.isNotEmpty) ...[
                          Container(
                            width: double.infinity,
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
                        
                        // Email field - values are preserved in controllers
                        AppTextField(
                          label: 'Email',
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          enabled: !authProvider.isLoading,
                          errorText: _emailError,
                          onChanged: (value) {
                            // Clear error when user starts typing
                            if (_emailError != null) {
                              setState(() {
                                _emailError = null;
                              });
                            }
                          },
                        ),
                        const SizedBox(height: 16),
                        
                        // Password field
                        AppTextField(
                          label: 'Password',
                          controller: _passwordController,
                          obscureText: !_showPassword,
                          enabled: !authProvider.isLoading,
                          errorText: _passwordError,
                          onChanged: (value) {
                            // Clear error when user starts typing
                            if (_passwordError != null) {
                              setState(() {
                                _passwordError = null;
                              });
                            }
                          },
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
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
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
                                fillColor: MaterialStateProperty.resolveWith<Color>(
                                  (Set<MaterialState> states) {
                                    if (states.contains(MaterialState.selected)) {
                                      return const Color(0xFF0d9488);
                                    }
                                    return Colors.transparent;
                                  },
                                ),
                                side: const BorderSide(
                                  color: Color(0xFF0d9488),
                                  width: 2,
                                ),
                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                visualDensity: VisualDensity.compact,
                              ),
                              const SizedBox(width: 4),
                              GestureDetector(
                                onTap: authProvider.isLoading
                                    ? null
                                    : () {
                                        setState(() {
                                          _rememberMe = !_rememberMe;
                                        });
                                      },
                                child: const Text(
                                  'Remember Me',
                                  style: TextStyle(fontSize: 14),
                                ),
                              ),
                            ],
                          ),
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
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                'Demo accounts:',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'cs@demo.com | tech@demo.com | leader@demo.com',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Password: password',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade700,
                                ),
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

