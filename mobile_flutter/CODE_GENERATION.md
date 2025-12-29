# Code Generation

This project uses `json_serializable` for automatic JSON serialization/deserialization.

## Generate Code

After adding or modifying models in `lib/core/api/models/`, run:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

This will generate the `.g.dart` files needed for JSON serialization.

## Models Requiring Generation

- `lib/core/api/models/auth_models.dart` → `auth_models.g.dart`
- `lib/core/api/models/case_models.dart` → `case_models.g.dart`
- `lib/core/api/models/data_models.dart` → `data_models.g.dart`

## Watch Mode

For continuous generation during development:

```bash
flutter pub run build_runner watch
```

