enum CaseStatus {
  open,
  pending,
  inProgress,
  completed,
  closed,
  rejected,
  cancelled,
}

extension CaseStatusExtension on CaseStatus {
  String get displayName {
    switch (this) {
      case CaseStatus.open:
        return 'Open';
      case CaseStatus.pending:
        return 'Pending';
      case CaseStatus.inProgress:
        return 'In Progress';
      case CaseStatus.completed:
        return 'Completed';
      case CaseStatus.closed:
        return 'Closed';
      case CaseStatus.rejected:
        return 'Rejected';
      case CaseStatus.cancelled:
        return 'Cancelled';
    }
  }
}

