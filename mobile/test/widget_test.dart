import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('Loading screen renders label', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: LoadingScreen(label: 'Loading…'),
      ),
    );

    expect(find.text('Loading…'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
