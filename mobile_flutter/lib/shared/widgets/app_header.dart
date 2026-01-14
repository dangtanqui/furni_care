import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';

class AppHeader extends StatefulWidget implements PreferredSizeWidget {
  const AppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  State<AppHeader> createState() => _AppHeaderState();
}

class _AppHeaderState extends State<AppHeader> {
  bool _showUserMenu = false;
  OverlayEntry? _menuOverlayEntry;
  
  void _closeMenu() {
    if (_showUserMenu) {
      _menuOverlayEntry?.remove();
      _menuOverlayEntry = null;
      setState(() {
        _showUserMenu = false;
      });
    }
  }
  
  void _openMenu(BuildContext context) {
    if (_showUserMenu) return;
    
    setState(() {
      _showUserMenu = true;
    });
    
    // Add delay before adding click outside listener (like frontend does with 100ms)
    Future.delayed(const Duration(milliseconds: 100), () {
      if (!_showUserMenu || !mounted) return;
      
      final RenderBox? renderBox = context.findRenderObject() as RenderBox?;
      if (renderBox == null) return;
      
      final overlay = Overlay.of(context);
      
      _menuOverlayEntry = OverlayEntry(
        builder: (context) => Listener(
          onPointerDown: (_) => _closeMenu(),
          child: Stack(
            children: [
              Positioned.fill(
                child: GestureDetector(
                  onTap: _closeMenu,
                  behavior: HitTestBehavior.opaque,
                  child: Container(color: Colors.transparent),
                ),
              ),
            ],
          ),
        ),
      );
      
      overlay.insert(_menuOverlayEntry!);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xFF1e3a5f), // Dark blue background
      foregroundColor: Colors.white,
      flexibleSpace: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            children: [
              // Logo with icon (clickable to navigate to case list)
              GestureDetector(
                onTap: () {
                  final context = this.context;
                  final router = GoRouter.of(context);
                  router.go('/cases');
                },
                child: Row(
                  children: [
                    const Icon(
                      Icons.chair_outlined,
                      size: 32,
                      color: Color(0xFF0d9488), // Teal color
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'FurniCare',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // User info and logout
              Consumer<AuthProvider>(
                builder: (context, authProvider, _) {
                  if (authProvider.user != null) {
                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // User icon button
                            GestureDetector(
                              onTap: () {
                                if (_showUserMenu) {
                                  _closeMenu();
                                } else {
                                  _openMenu(context);
                                }
                              },
                              behavior: HitTestBehavior.opaque,
                              child: const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                                child: Icon(Icons.person_outline, size: 24, color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 4),
                            // Logout button
                            GestureDetector(
                              onTap: () async {
                                await authProvider.logout();
                                if (context.mounted) {
                                  context.go('/login');
                                }
                              },
                              child: const Padding(
                                padding: EdgeInsets.only(left: 8.0, top: 8.0, bottom: 8.0),
                                child: Icon(Icons.logout, size: 20, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                        // User menu dropdown
                        if (_showUserMenu)
                          Positioned(
                            right: 0,
                            top: 40,
                            child: GestureDetector(
                              onTap: () {}, // Prevent closing when tapping on menu itself
                              child: Material(
                                elevation: 8,
                                borderRadius: BorderRadius.circular(8),
                                color: Colors.transparent,
                                child: Container(
                                  margin: const EdgeInsets.only(top: 8),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 8,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        authProvider.user!.name,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0d9488),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          authProvider.user!.role.toUpperCase(),
                                          style: const TextStyle(
                                            fontSize: 10,
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
