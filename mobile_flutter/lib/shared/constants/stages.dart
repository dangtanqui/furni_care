class Stage {
  final int num;
  final String name;
  
  const Stage({
    required this.num,
    required this.name,
  });
}

class Stages {
  static const List<Stage> all = [
    Stage(num: 1, name: 'Case Creation'),
    Stage(num: 2, name: 'Investigation'),
    Stage(num: 3, name: 'Solution & Cost Approval'),
    Stage(num: 4, name: 'Execution'),
    Stage(num: 5, name: 'Client Feedback & Final Cost'),
  ];
  
  static Stage getStage(int num) {
    return all.firstWhere((s) => s.num == num);
  }
}

