import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

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
              // Logo with icon
              Row(
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
              const Spacer(),
              // User info and logout - use Flexible to prevent overflow
              Consumer<AuthProvider>(
                builder: (context, authProvider, _) {
                  if (authProvider.user != null) {
                    return Flexible(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // User icon and name - use Flexible to prevent overflow
                          Flexible(
                            flex: 2,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.person_outline,
                                  size: 16,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    authProvider.user!.name,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.white,
                                    ),
                                    overflow: TextOverflow.fade,
                                    maxLines: 1,
                                    softWrap: false,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Role badge - should not truncate
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
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
                                    maxLines: 1,
                                    overflow: TextOverflow.visible,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 4),
                          // Logout button - no right padding
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

