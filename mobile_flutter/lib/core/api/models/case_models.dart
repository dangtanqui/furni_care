import 'package:json_annotation/json_annotation.dart';

part 'case_models.g.dart';

@JsonSerializable()
class CaseListItem {
  final int id;
  @JsonKey(name: 'case_number')
  final String caseNumber;
  final String client;
  final String site;
  @JsonKey(name: 'current_stage')
  final int currentStage;
  @JsonKey(name: 'stage_name')
  final String stageName;
  final CaseStatus status;
  final CasePriority priority;
  @JsonKey(name: 'assigned_to')
  final String? assignedTo;
  @JsonKey(name: 'created_at')
  final String createdAt;
  
  CaseListItem({
    required this.id,
    required this.caseNumber,
    required this.client,
    required this.site,
    required this.currentStage,
    required this.stageName,
    required this.status,
    required this.priority,
    this.assignedTo,
    required this.createdAt,
  });
  
  factory CaseListItem.fromJson(Map<String, dynamic> json) => _$CaseListItemFromJson(json);
  Map<String, dynamic> toJson() => _$CaseListItemToJson(this);
}

@JsonSerializable()
class CasesResponse {
  final List<CaseListItem> data;
  final Pagination pagination;
  
  CasesResponse({
    required this.data,
    required this.pagination,
  });
  
  factory CasesResponse.fromJson(Map<String, dynamic> json) => _$CasesResponseFromJson(json);
  Map<String, dynamic> toJson() => _$CasesResponseToJson(this);
}

@JsonSerializable()
class Pagination {
  final int page;
  @JsonKey(name: 'per_page')
  final int perPage;
  final int total;
  @JsonKey(name: 'total_pages')
  final int totalPages;
  
  Pagination({
    required this.page,
    required this.perPage,
    required this.total,
    required this.totalPages,
  });
  
  factory Pagination.fromJson(Map<String, dynamic> json) => _$PaginationFromJson(json);
  Map<String, dynamic> toJson() => _$PaginationToJson(this);
}

@JsonSerializable()
class CaseDetail {
  final int id;
  @JsonKey(name: 'case_number')
  final String caseNumber;
  @JsonKey(name: 'current_stage')
  final int currentStage;
  @JsonKey(name: 'stage_name')
  final String stageName;
  final CaseStatus status;
  @JsonKey(name: 'attempt_number')
  final int attemptNumber;
  final ClientInfo client;
  final SiteInfo site;
  final ContactInfo contact;
  @JsonKey(name: 'created_by')
  final UserInfo createdBy;
  @JsonKey(name: 'assigned_to')
  final UserInfo? assignedTo;
  @JsonKey(name: 'assigned_to_id')
  final int? assignedToId;
  final String description;
  @JsonKey(name: 'case_type')
  final String caseType;
  final CasePriority priority;
  @JsonKey(name: 'investigation_report')
  final String investigationReport;
  @JsonKey(name: 'investigation_checklist')
  final String investigationChecklist;
  @JsonKey(name: 'root_cause')
  final String rootCause;
  @JsonKey(name: 'solution_description')
  final String solutionDescription;
  @JsonKey(name: 'solution_checklist')
  final String solutionChecklist;
  @JsonKey(name: 'planned_execution_date')
  final String plannedExecutionDate;
  @JsonKey(name: 'cost_required')
  final bool costRequired;
  @JsonKey(name: 'estimated_cost')
  final double estimatedCost;
  @JsonKey(name: 'cost_description')
  final String costDescription;
  @JsonKey(name: 'cost_status')
  final CostStatus? costStatus;
  @JsonKey(name: 'execution_report')
  final String executionReport;
  @JsonKey(name: 'execution_checklist')
  final String executionChecklist;
  @JsonKey(name: 'client_signature')
  final String clientSignature;
  @JsonKey(name: 'client_feedback')
  final String clientFeedback;
  @JsonKey(name: 'client_rating')
  final int clientRating;
  @JsonKey(name: 'cs_notes')
  final String csNotes;
  @JsonKey(name: 'final_feedback')
  final String finalFeedback;
  @JsonKey(name: 'final_rating')
  final int finalRating;
  @JsonKey(name: 'final_cost')
  final double? finalCost;
  @JsonKey(name: 'final_cost_status')
  final FinalCostStatus? finalCostStatus;
  @JsonKey(name: 'approved_final_cost')
  final double? approvedFinalCost;
  @JsonKey(name: 'final_cost_approved_by')
  final UserInfo? finalCostApprovedBy;
  @JsonKey(name: 'stage_attachments')
  final Map<String, List<CaseAttachment>> stageAttachments;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'updated_at')
  final String updatedAt;
  
  CaseDetail({
    required this.id,
    required this.caseNumber,
    required this.currentStage,
    required this.stageName,
    required this.status,
    required this.attemptNumber,
    required this.client,
    required this.site,
    required this.contact,
    required this.createdBy,
    this.assignedTo,
    this.assignedToId,
    required this.description,
    required this.caseType,
    required this.priority,
    required this.investigationReport,
    required this.investigationChecklist,
    required this.rootCause,
    required this.solutionDescription,
    required this.solutionChecklist,
    required this.plannedExecutionDate,
    required this.costRequired,
    required this.estimatedCost,
    required this.costDescription,
    this.costStatus,
    required this.executionReport,
    required this.executionChecklist,
    required this.clientSignature,
    required this.clientFeedback,
    required this.clientRating,
    required this.csNotes,
    required this.finalFeedback,
    required this.finalRating,
    this.finalCost,
    this.finalCostStatus,
    this.approvedFinalCost,
    this.finalCostApprovedBy,
    required this.stageAttachments,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory CaseDetail.fromJson(Map<String, dynamic> json) => _$CaseDetailFromJson(json);
  Map<String, dynamic> toJson() => _$CaseDetailToJson(this);
}

@JsonSerializable()
class ClientInfo {
  final int id;
  final String name;
  
  ClientInfo({
    required this.id,
    required this.name,
  });
  
  factory ClientInfo.fromJson(Map<String, dynamic> json) => _$ClientInfoFromJson(json);
  Map<String, dynamic> toJson() => _$ClientInfoToJson(this);
}

@JsonSerializable()
class SiteInfo {
  final int id;
  final String name;
  final String city;
  
  SiteInfo({
    required this.id,
    required this.name,
    required this.city,
  });
  
  factory SiteInfo.fromJson(Map<String, dynamic> json) => _$SiteInfoFromJson(json);
  Map<String, dynamic> toJson() => _$SiteInfoToJson(this);
}

@JsonSerializable()
class ContactInfo {
  final int id;
  final String name;
  final String phone;
  
  ContactInfo({
    required this.id,
    required this.name,
    required this.phone,
  });
  
  factory ContactInfo.fromJson(Map<String, dynamic> json) => _$ContactInfoFromJson(json);
  Map<String, dynamic> toJson() => _$ContactInfoToJson(this);
}

@JsonSerializable()
class UserInfo {
  final int id;
  final String name;
  
  UserInfo({
    required this.id,
    required this.name,
  });
  
  factory UserInfo.fromJson(Map<String, dynamic> json) => _$UserInfoFromJson(json);
  Map<String, dynamic> toJson() => _$UserInfoToJson(this);
}

@JsonSerializable()
class CaseAttachment {
  final int id;
  final String filename;
  final String url;
  final int stage;
  @JsonKey(name: 'attachment_type')
  final String attachmentType;
  
  CaseAttachment({
    required this.id,
    required this.filename,
    required this.url,
    required this.stage,
    required this.attachmentType,
  });
  
  factory CaseAttachment.fromJson(Map<String, dynamic> json) => _$CaseAttachmentFromJson(json);
  Map<String, dynamic> toJson() => _$CaseAttachmentToJson(this);
}

enum CaseStatus {
  @JsonValue('open')
  open,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('pending')
  pending,
  @JsonValue('completed')
  completed,
  @JsonValue('closed')
  closed,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('rejected')
  rejected,
}

enum CasePriority {
  @JsonValue('low')
  low,
  @JsonValue('medium')
  medium,
  @JsonValue('high')
  high,
}

enum CostStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('approved')
  approved,
  @JsonValue('rejected')
  rejected,
}

enum FinalCostStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('approved')
  approved,
  @JsonValue('rejected')
  rejected,
}

