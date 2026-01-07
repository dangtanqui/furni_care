import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { TIMING } from '../constants/timing';
import '../styles/components/Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  error?: boolean;
  onOpen?: () => void;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
  name,
  error = false,
  onOpen,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, showAbove: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const isPlaceholder = !value || value === '' || !selectedOption;

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const dropdownMaxHeight = 240; // max-h-60 = 240px
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          // Show above if not enough space below, but enough space above
          const showAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;
          
          // Calculate actual dropdown height (estimate based on options)
          const estimatedHeight = Math.min(options.length * 40 + 8, dropdownMaxHeight); // ~40px per option + padding
          
          // Use fixed positioning - no need for scroll offsets
          const position = {
            top: showAbove ? rect.top - estimatedHeight - 2 : rect.bottom + 2,
            left: rect.left,
            width: Math.max(rect.width, 120), // Ensure minimum width
            showAbove,
          };
          setDropdownPosition(position);
        }
      };
      
      // Update immediately
      updatePosition();
      
      // Also update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Also update after a small delay to handle any layout shifts
      const timeoutId = setTimeout(updatePosition, TIMING.SELECT_UPDATE_DELAY);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      // Reset position when closed
      setDropdownPosition({ top: 0, left: 0, width: 0, showAbove: false });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both button and dropdown
      const isClickOnButton = containerRef.current?.contains(target);
      const isClickOnDropdown = dropdownRef.current?.contains(target);
      
      if (!isClickOnButton && !isClickOnDropdown) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid closing immediately when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen]);

  // Close dropdown when another select opens
  useEffect(() => {
    const handleOtherSelectClick = () => {
      if (isOpen) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    // Listen for clicks on other selects
    const allSelects = document.querySelectorAll('[data-custom-select]');
    allSelects.forEach(select => {
      if (select !== containerRef.current) {
        select.addEventListener('click', handleOtherSelectClick);
      }
    });

    return () => {
      allSelects.forEach(select => {
        select.removeEventListener('click', handleOtherSelectClick);
      });
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    setIsFocused(willOpen);
    if (willOpen && onOpen) {
      onOpen();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
    // Small delay to ensure click is processed
    setTimeout(() => {
      buttonRef.current?.blur();
    }, 0);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} data-custom-select>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        aria-label={id ? undefined : placeholder}
        aria-labelledby={id ? `${id}-label` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid !== undefined ? ariaInvalid : error}
        role="combobox"
        onClick={handleToggle}
        onMouseDown={(e) => {
          // Prevent form submission when clicking dropdown
          if (e.button === 0) {
            e.preventDefault();
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay to allow option click to register
          setTimeout(() => {
            if (!isOpen) {
              setIsFocused(false);
            }
          }, TIMING.SELECT_BLUR_DELAY);
        }}
        disabled={disabled}
        className={`
          select-button
          ${error ? 'select-button-error' : ''}
          ${isFocused && isOpen ? 'select-button-focused' : ''}
          ${error && (isFocused || isOpen) ? 'select-button-error-focused' : ''}
        `}
      >
        <span 
          className={`select-button-text ${isPlaceholder ? 'select-button-text-placeholder' : 'select-button-text-value'}`}
        >
          {isPlaceholder ? placeholder : (selectedOption?.label || placeholder)}
        </span>
        <ChevronDown
          className={`select-chevron ${isOpen ? 'select-chevron-open' : ''}`}
        />
      </button>

      {isOpen && dropdownPosition.width > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="select-dropdown"
            data-position={dropdownPosition.showAbove ? 'above' : 'below'}
            style={{
              '--select-dropdown-top': `${dropdownPosition.top}px`,
              '--select-dropdown-left': `${dropdownPosition.left}px`,
              '--select-dropdown-width': `${dropdownPosition.width}px`,
            } as React.CSSProperties}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onWheel={(e) => {
              // Allow scrolling within dropdown
              e.stopPropagation();
            }}
          >
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={`select-option ${value === option.value ? 'select-option-selected' : 'select-option-default'}`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="select-no-options">No options</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
