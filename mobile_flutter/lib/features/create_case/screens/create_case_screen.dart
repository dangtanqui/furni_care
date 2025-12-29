import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/text_field.dart';
import '../providers/create_case_provider.dart';

class CreateCaseScreen extends StatefulWidget {
  const CreateCaseScreen({super.key});
  
  @override
  State<CreateCaseScreen> createState() => _CreateCaseScreenState();
}

class _CreateCaseScreenState extends State<CreateCaseScreen> {
  late TextEditingController _descriptionController;
  
  @override
  void initState() {
    super.initState();
    _descriptionController = TextEditingController();
  }
  
  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }
  
  Future<void> _showAttachmentOptions(BuildContext context, CreateCaseProvider provider) async {
    final ImagePicker picker = ImagePicker();
    
    final option = await showModalBottomSheet<String>(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Choose from Gallery'),
                onTap: () => Navigator.pop(context, 'gallery'),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Take Photo'),
                onTap: () => Navigator.pop(context, 'camera'),
              ),
              ListTile(
                leading: const Icon(Icons.insert_drive_file),
                title: const Text('Choose File'),
                onTap: () => Navigator.pop(context, 'file'),
              ),
            ],
          ),
        );
      },
    );
    
    if (option == null) return;
    
    if (option == 'gallery' || option == 'camera') {
      // Pick image
      final XFile? image = await picker.pickImage(
        source: option == 'camera' ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 85,
      );
      if (image != null) {
        provider.addFile(image.path);
      }
    } else if (option == 'file') {
      // Pick file
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
      );
      if (result != null) {
        for (final file in result.files) {
          if (file.path != null) {
            provider.addFile(file.path!);
          }
        }
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create New Case'),
        backgroundColor: const Color(0xFF0d9488),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
      ),
      body: ChangeNotifierProvider(
        create: (context) {
          final caseService = Provider.of<CaseService>(context, listen: false);
          final dataService = Provider.of<DataService>(context, listen: false);
          return CreateCaseProvider(caseService, dataService);
        },
        child: Consumer<CreateCaseProvider>(
          builder: (context, provider, _) {
            // Sync controller with provider description
            if (_descriptionController.text != provider.description) {
              _descriptionController.text = provider.description;
            }
            
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Client dropdown
                    DropdownButtonFormField<String>(
                      value: provider.clientId.isEmpty ? null : provider.clientId,
                      decoration: InputDecoration(
                        labelText: 'Client *',
                        errorText: provider.errors['client_id'],
                        border: const OutlineInputBorder(),
                      ),
                      items: provider.clients.map((client) {
                        return DropdownMenuItem(
                          value: client.id.toString(),
                          child: Text(client.name),
                        );
                      }).toList(),
                      onChanged: (value) {
                        provider.setClientId(value ?? '');
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    // Site dropdown
                    DropdownButtonFormField<String>(
                      value: provider.siteId.isEmpty ? null : provider.siteId,
                      decoration: InputDecoration(
                        labelText: 'Site *',
                        errorText: provider.errors['site_id'],
                        border: const OutlineInputBorder(),
                      ),
                      items: provider.sites.map((site) {
                        return DropdownMenuItem(
                          value: site.id.toString(),
                          child: Text('${site.name} - ${site.city}'),
                        );
                      }).toList(),
                      onChanged: provider.clientId.isEmpty
                          ? null
                          : (value) {
                              provider.setSiteId(value ?? '');
                            },
                    ),
                    const SizedBox(height: 16),
                    
                    // Contact dropdown
                    DropdownButtonFormField<String>(
                      value: provider.contactId.isEmpty ? null : provider.contactId,
                      decoration: InputDecoration(
                        labelText: 'Contact Person *',
                        errorText: provider.errors['contact_id'],
                        border: const OutlineInputBorder(),
                        hintText: provider.siteId.isEmpty 
                            ? 'Select Site first' 
                            : provider.contacts.isEmpty 
                                ? 'No contacts available' 
                                : null,
                      ),
                      items: provider.contacts.isEmpty
                          ? null
                          : provider.contacts.map((contact) {
                              return DropdownMenuItem(
                                value: contact.id.toString(),
                                child: Text('${contact.name} - ${contact.phone}'),
                              );
                            }).toList(),
                      onChanged: provider.siteId.isEmpty || provider.contacts.isEmpty
                          ? null
                          : (value) {
                              provider.setContactId(value ?? '');
                            },
                    ),
                    const SizedBox(height: 16),
                    
                    // Description
                    AppTextField(
                      label: 'Description',
                      controller: _descriptionController,
                      onChanged: provider.setDescription,
                      maxLines: 4,
                      errorText: provider.errors['description'],
                    ),
                    const SizedBox(height: 16),
                    
                    // File upload
                    ElevatedButton.icon(
                      icon: const Icon(Icons.attach_file),
                      label: const Text('Add Attachments'),
                      onPressed: () => _showAttachmentOptions(context, provider),
                    ),
                    if (provider.filePaths.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      ...provider.filePaths.asMap().entries.map((entry) {
                        return ListTile(
                          title: Text(entry.value.split('/').last),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () => provider.removeFile(entry.key),
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 16),
                    
                    // Case type and priority row
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: provider.caseType.isEmpty ? null : provider.caseType,
                            decoration: InputDecoration(
                              labelText: 'Type *',
                              errorText: provider.errors['case_type'],
                              border: const OutlineInputBorder(),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'warranty', child: Text('Warranty')),
                              DropdownMenuItem(value: 'maintenance', child: Text('Maintenance')),
                              DropdownMenuItem(value: 'repair', child: Text('Repair')),
                            ],
                            onChanged: (value) {
                              provider.setCaseType(value ?? '');
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: provider.priority.isEmpty ? null : provider.priority,
                            decoration: InputDecoration(
                              labelText: 'Priority *',
                              errorText: provider.errors['priority'],
                              border: const OutlineInputBorder(),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'low', child: Text('Low')),
                              DropdownMenuItem(value: 'medium', child: Text('Medium')),
                              DropdownMenuItem(value: 'high', child: Text('High')),
                            ],
                            onChanged: (value) {
                              provider.setPriority(value ?? '');
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    
                    // Submit button
                    AppButton(
                      text: 'Submit',
                      onPressed: provider.isFormValid && !provider.isLoading
                          ? () async {
                              final success = await provider.submit();
                              if (success && context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Case created successfully'),
                                    backgroundColor: Colors.green,
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                                // Wait a bit for snackbar to show, then navigate back
                                await Future.delayed(const Duration(milliseconds: 500));
                                if (context.mounted) {
                                  if (context.canPop()) {
                                    context.pop();
                                  } else {
                                    context.go('/');
                                  }
                                }
                              } else if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Failed to create case'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          : null,
                      variant: ButtonVariant.primary,
                      isLoading: provider.isLoading,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

