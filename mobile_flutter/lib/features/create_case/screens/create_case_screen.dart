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
import '../../../shared/widgets/app_header_back.dart';
import '../../../shared/widgets/custom_select.dart';
import '../../../shared/widgets/file_upload.dart';
import '../../../shared/utils/toast_helper.dart';
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
  
  Future<void> _handleFileSelection(String option, CreateCaseProvider provider) async {
    final ImagePicker picker = ImagePicker();
    
    if (option == 'gallery' || option == 'camera') {
      final XFile? image = await picker.pickImage(
        source: option == 'camera' ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 85,
      );
      if (image != null) {
        provider.addFile(image.path);
      }
    } else if (option == 'file') {
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
      appBar: const AppHeaderBack(),
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
                    // Title
                    const Text(
                      'Create New Case',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1e3a5f),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Client dropdown
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Client *',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: provider.errors['client_id'] != null 
                                ? Colors.red 
                                : const Color(0xFF1e3a5f),
                          ),
                        ),
                        const SizedBox(height: 8),
                        CustomSelect(
                          value: provider.clientId.isEmpty ? null : provider.clientId,
                          onChange: (value) {
                            provider.setClientId(value);
                          },
                          placeholder: 'Select Client',
                          options: provider.clients.map((client) {
                            return SelectOption(
                              value: client.id.toString(),
                              label: client.name,
                            );
                          }).toList(),
                        ),
                        if (provider.errors['client_id'] != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.error_outline, size: 16, color: Colors.red.shade700),
                              const SizedBox(width: 4),
                              Text(
                                'Client ${provider.errors['client_id']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Site dropdown
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Site *',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: provider.errors['site_id'] != null 
                                ? Colors.red 
                                : const Color(0xFF1e3a5f),
                          ),
                        ),
                        const SizedBox(height: 8),
                        CustomSelect(
                          value: provider.siteId.isEmpty ? null : provider.siteId,
                          onChange: (value) {
                            if (!provider.clientId.isEmpty) {
                              provider.setSiteId(value);
                            }
                          },
                          placeholder: 'Select Site',
                          options: provider.sites.map((site) {
                            return SelectOption(
                              value: site.id.toString(),
                              label: '${site.name} - ${site.city}',
                            );
                          }).toList(),
                          disabled: provider.clientId.isEmpty,
                        ),
                        if (provider.errors['site_id'] != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.error_outline, size: 16, color: Colors.red.shade700),
                              const SizedBox(width: 4),
                              Text(
                                'Site ${provider.errors['site_id']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Contact dropdown
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Contact Person *',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: provider.errors['contact_id'] != null 
                                ? Colors.red 
                                : const Color(0xFF1e3a5f),
                          ),
                        ),
                        const SizedBox(height: 8),
                        CustomSelect(
                          value: provider.contactId.isEmpty ? null : provider.contactId,
                          onChange: (value) {
                            if (!provider.siteId.isEmpty && provider.contacts.isNotEmpty) {
                              provider.setContactId(value);
                            }
                          },
                          placeholder: 'Select Contact Person',
                          options: provider.contacts.map((contact) {
                            return SelectOption(
                              value: contact.id.toString(),
                              label: '${contact.name} - ${contact.phone}',
                            );
                          }).toList(),
                          disabled: provider.siteId.isEmpty || provider.contacts.isEmpty,
                        ),
                        if (provider.errors['contact_id'] != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.error_outline, size: 16, color: Colors.red.shade700),
                              const SizedBox(width: 4),
                              Text(
                                'Contact Person ${provider.errors['contact_id']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Description textarea
                    AppTextField(
                      label: 'Description',
                      controller: _descriptionController,
                      onChanged: provider.setDescription,
                      maxLines: 5,
                      hint: 'Describe the issue...',
                      errorText: provider.errors['description'],
                    ),
                    const SizedBox(height: 16),
                    
                    // File upload
                    FileUpload(
                      label: 'Photos / Attachments',
                      filePaths: provider.filePaths,
                      onFileSelected: (option) => _handleFileSelection(option, provider),
                      onDelete: (index) => provider.removeFile(index),
                    ),
                    const SizedBox(height: 16),
                    
                    // Case type dropdown - vertical
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Type *',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: provider.errors['case_type'] != null 
                                ? Colors.red 
                                : const Color(0xFF1e3a5f),
                          ),
                        ),
                        const SizedBox(height: 8),
                        CustomSelect(
                          value: provider.caseType.isEmpty ? null : provider.caseType,
                          onChange: (value) {
                            provider.setCaseType(value);
                          },
                          placeholder: 'Select Type',
                          options: const [
                            SelectOption(value: 'warranty', label: 'Warranty'),
                            SelectOption(value: 'maintenance', label: 'Maintenance'),
                            SelectOption(value: 'repair', label: 'Repair'),
                          ],
                        ),
                        if (provider.errors['case_type'] != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.error_outline, size: 16, color: Colors.red.shade700),
                              const SizedBox(width: 4),
                              Text(
                                'Type ${provider.errors['case_type']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Priority dropdown - vertical
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Priority *',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: provider.errors['priority'] != null 
                                ? Colors.red 
                                : const Color(0xFF1e3a5f),
                          ),
                        ),
                        const SizedBox(height: 8),
                        CustomSelect(
                          value: provider.priority.isEmpty ? null : provider.priority,
                          onChange: (value) {
                            provider.setPriority(value);
                          },
                          placeholder: 'Select Priority',
                          options: const [
                            SelectOption(value: 'low', label: 'Low'),
                            SelectOption(value: 'medium', label: 'Medium'),
                            SelectOption(value: 'high', label: 'High'),
                          ],
                        ),
                        if (provider.errors['priority'] != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.error_outline, size: 16, color: Colors.red.shade700),
                              const SizedBox(width: 4),
                              Text(
                                'Priority ${provider.errors['priority']}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 32),
                    
                    // Submit button
                    AppButton(
                      text: 'Submit',
                      onPressed: provider.isFormValid && !provider.isLoading
                          ? () async {
                              final success = await provider.submit();
                              if (!mounted) return; // Check if widget is still mounted
                              
                              if (success) {
                                // Show success toast
                                ToastHelper.showSuccess(context, 'Case created successfully', duration: const Duration(seconds: 2));
                                // Wait a bit for toast to show, then navigate
                                await Future.delayed(const Duration(milliseconds: 300));
                                if (!mounted) return; // Check again before navigation
                                
                                if (context.canPop()) {
                                  context.pop();
                                } else {
                                  context.go('/');
                                }
                              } else {
                                // Show error toast
                                ToastHelper.showError(context, 'Failed to create case');
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
