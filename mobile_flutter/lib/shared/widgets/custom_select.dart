import 'package:flutter/material.dart';

class SelectOption {
  final String value;
  final String label;

  const SelectOption({
    required this.value,
    required this.label,
  });
}

class CustomSelect extends StatefulWidget {
  final String? value;
  final Function(String) onChange;
  final List<SelectOption> options;
  final String placeholder;
  final bool disabled;

  const CustomSelect({
    super.key,
    this.value,
    required this.onChange,
    required this.options,
    required this.placeholder,
    this.disabled = false,
  });

  // Static method to close all open selects
  static void closeAll() {
    _CustomSelectState.closeAllDropdowns();
  }

  @override
  State<CustomSelect> createState() => _CustomSelectState();
}

class _CustomSelectState extends State<CustomSelect> {
  bool _isOpen = false;
  final GlobalKey _buttonKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  
  static final Set<_CustomSelectState> _openSelects = {};
  
  // Static method to close all dropdowns
  static void closeAllDropdowns() {
    for (final select in _openSelects.toList()) {
      select._closeDropdown();
    }
  }

  SelectOption? get _selectedOption {
    if (widget.value == null || widget.value!.isEmpty) {
      // Return null to show placeholder, don't try to find empty option
      return null;
    }
    // Use firstWhere with orElse (like frontend uses find)
    try {
      return widget.options.firstWhere(
        (opt) => opt.value == widget.value,
        orElse: () => throw Exception('Not found'),
      );
    } catch (e) {
      // If option not found, return null to show placeholder
      return null;
    }
  }

  void _toggleDropdown() {
    if (widget.disabled) return;

    if (_isOpen) {
      _closeDropdown();
    } else {
      _openDropdown();
    }
  }

  void _openDropdown() {
    // Close all other selects
    for (final select in _openSelects.toList()) {
      if (select != this) {
        select._closeDropdown();
      }
    }
    
    // Close existing overlay if any
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
    }
    
    _openSelects.add(this);
    
    setState(() {
      _isOpen = true;
    });

    // Calculate position and create overlay (like frontend does)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_isOpen || !mounted) return;
      
      final RenderBox? renderBox = _buttonKey.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox == null || !_isOpen) return;

      final size = renderBox.size;
      final offset = renderBox.localToGlobal(Offset.zero);
      final screenHeight = MediaQuery.of(context).size.height;
      final availableSpaceBelow = screenHeight - offset.dy - size.height;
      final availableSpaceAbove = offset.dy;
      final dropdownHeight = widget.options.length * 48.0; // Approximate height per option
      final maxDropdownHeight = 240.0;
      final actualDropdownHeight = dropdownHeight > maxDropdownHeight ? maxDropdownHeight : dropdownHeight;
      
      // Show dropdown above if there's not enough space below and more space above
      final showAbove = availableSpaceBelow < actualDropdownHeight && availableSpaceAbove > availableSpaceBelow;

      // Calculate top position for dropdown when showing above
      // Position it right above the button with small gap (4px) - dropdown should end just above button
      // This allows it to cover the label but not the dropdown button itself
      // Use dynamic offset based on context - case list needs more space, create case needs less
      final offsetAdjustment = showAbove ? -18 : 0; // Unified offset for both cases
      final topPosition = showAbove 
          ? offset.dy - actualDropdownHeight + size.height + offsetAdjustment
          : offset.dy + size.height + 2;

      // Create overlay with tap outside to close (using Listener for better event handling)
      _overlayEntry = OverlayEntry(
        builder: (context) => Material(
          type: MaterialType.transparency, // Make overlay background transparent
          child: Stack(
            children: [
              // Full screen tap detector to close dropdown
              Positioned.fill(
                child: GestureDetector(
                  onTap: _closeDropdown,
                  behavior: HitTestBehavior.translucent,
                  child: Container(color: Colors.transparent),
                ),
              ),
              // Dropdown content - wrapped in GestureDetector to prevent closing when clicking inside
              Positioned(
                left: offset.dx,
                top: topPosition,
                width: size.width,
                child: GestureDetector(
                  onTap: () {}, // Prevent tap from propagating to parent
                  child: Material(
                    elevation: 8,
                    borderRadius: BorderRadius.circular(8),
                    shadowColor: Colors.black.withOpacity(0.2),
                    color: Colors.transparent,
                child: Container(
                  constraints: BoxConstraints(maxHeight: maxDropdownHeight),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                    boxShadow: showAbove
                        ? [
                            // Shadow pointing upward when showing above
                            BoxShadow(
                              color: Colors.black.withOpacity(0.15),
                              blurRadius: 8,
                              offset: const Offset(0, -2), // Negative offset for upward shadow
                              spreadRadius: 0,
                            ),
                          ]
                        : [
                            // Normal downward shadow when showing below
                            BoxShadow(
                              color: Colors.black.withOpacity(0.15),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                              spreadRadius: 0,
                            ),
                          ],
                  ),
                  child: ListView(
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    children: widget.options.map((option) {
                      final isSelected = widget.value == option.value;
                      return InkWell(
                        onTap: () {
                          widget.onChange(option.value);
                          _closeDropdown();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF0d9488).withOpacity(0.1) : null,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  option.label,
                                  style: TextStyle(
                                    color: isSelected ? const Color(0xFF0d9488) : Colors.black87,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              ),
            ),
            ],
          ),
        ),
      );

      // Insert overlay into Overlay
      final overlay = Overlay.of(context);
      overlay.insert(_overlayEntry!);
    });
  }

  void _closeDropdown() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    _openSelects.remove(this);
    setState(() {
      _isOpen = false;
    });
  }

  @override
  void dispose() {
    _closeDropdown();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Always show selected option label, never placeholder when value is set (even if empty)
    final displayText = _selectedOption?.label ?? widget.placeholder;
    final isPlaceholder = _selectedOption == null;
    
    return GestureDetector(
      onTap: () {
        // Close other dropdowns
        FocusScope.of(context).unfocus();
        _toggleDropdown();
      },
      child: Container(
        key: _buttonKey,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: _isOpen ? const Color(0xFF0d9488) : Colors.grey.shade300,
            width: _isOpen ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                displayText,
                style: TextStyle(
                  color: isPlaceholder ? Colors.grey.shade600 : Colors.black87,
                  fontSize: 14,
                ),
              ),
            ),
            Icon(
              _isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
              size: 20,
              color: Colors.grey.shade600,
            ),
          ],
        ),
      ),
    );
  }
}

