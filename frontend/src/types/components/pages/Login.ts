export interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  error: string;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onRememberMeChange: (rememberMe: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

