class ApiEndpoints {
  // Auth endpoints
  static const String login = '/auth/login';
  static const String getMe = '/auth/me';
  
  // Case endpoints
  static const String cases = '/cases';
  static String caseById(int id) => '/cases/$id';
  static String caseAdvanceStage(int id) => '/cases/$id/advance_stage';
  static String caseApproveCost(int id) => '/cases/$id/approve_cost';
  static String caseRejectCost(int id) => '/cases/$id/reject_cost';
  static String caseApproveFinalCost(int id) => '/cases/$id/approve_final_cost';
  static String caseRejectFinalCost(int id) => '/cases/$id/reject_final_cost';
  static String caseRedo(int id) => '/cases/$id/redo_case';
  static String caseCancel(int id) => '/cases/$id/cancel_case';
  static String caseAttachments(int id) => '/cases/$id/attachments';
  static String caseAttachment(int caseId, int attachmentId) => '/cases/$caseId/case_attachments/$attachmentId';
  
  // Data endpoints
  static const String clients = '/clients';
  static String clientSites(int clientId) => '/clients/$clientId/sites';
  static String siteContacts(int siteId) => '/sites/$siteId/contacts';
  static const String technicians = '/users/technicians';
}

