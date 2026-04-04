import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

String get _defaultApiBaseUrl => const String.fromEnvironment(
      'ZEALFLOW_API_URL',
      defaultValue: '',
    ).isNotEmpty
    ? const String.fromEnvironment('ZEALFLOW_API_URL', defaultValue: '')
    : (Platform.isAndroid ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

const _bgBase = Color(0xFFF6F1EA);
const _bgHover = Color(0xFFEFE7DD);
const _card = Color(0xFFFFFCF8);
const _borderWarm = Color(0xFFE6D9CA);
const _textPrimary = Color(0xFF23201C);
const _textSecondary = Color(0xFF665B50);
const _textTertiary = Color(0xFF9C9083);
const _accent = Color(0xFF4F46E5);
const _successColor = Color(0xFF4A7C59);
const _errorColor = Color(0xFFB42318);

BoxDecoration get _screenDecoration => const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [_bgBase, Color(0xFFFFFBF7)],
      ),
    );

ThemeData buildZealflowTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: _accent,
    brightness: Brightness.light,
    surface: _card,
    primary: _accent,
  );

  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: _bgBase,
    useMaterial3: true,
    fontFamily: 'System',
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: _textPrimary,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: _card,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: _borderWarm),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      hintStyle: const TextStyle(color: _textTertiary),
      labelStyle: const TextStyle(color: _textSecondary),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _borderWarm),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _borderWarm),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _accent, width: 1.3),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        side: const BorderSide(color: _borderWarm),
        foregroundColor: _textPrimary,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white.withValues(alpha: 0.92),
      indicatorColor: _accent.withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
  );
}

void main() {
  runApp(const ZealflowApp());
}

class ZealflowApp extends StatefulWidget {
  const ZealflowApp({super.key});

  @override
  State<ZealflowApp> createState() => _ZealflowAppState();
}

class _ZealflowAppState extends State<ZealflowApp> {
  late final AppController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AppController()..bootstrap();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return MaterialApp(
          title: 'Zealflow',
          debugShowCheckedModeBanner: false,
          theme: buildZealflowTheme(),
          home: _controller.isLoading
              ? const LoadingScreen(label: 'Loading…')
              : _controller.admin == null
                  ? AuthScreen(controller: _controller)
                  : RegistryScreen(controller: _controller),
        );
      },
    );
  }
}

class AppController extends ChangeNotifier {
  final ZealflowApi api = ZealflowApi(baseUrl: _defaultApiBaseUrl);
  AdminUser? admin;
  bool isLoading = true;
  List<FormSummary> forms = [];

  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    api.token = prefs.getString('zealflow_token');

    if (api.token != null && api.token!.isNotEmpty) {
      try {
        final me = await api.get('/api/auth/me');
        admin = AdminUser.fromJson(me);
        await refreshForms();
      } catch (_) {
        await logout();
      }
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    final result = await api.post('/api/auth/login', {
      'username': username,
      'password': password,
    });
    api.token = result['token'] as String;
    admin = AdminUser.fromJson(result['admin'] as Map<String, dynamic>);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('zealflow_token', api.token!);
    await refreshForms();
    notifyListeners();
  }

  Future<Map<String, dynamic>> signup(
    String username,
    String email,
    String password,
  ) async {
    final result = await api.post('/api/auth/signup', {
      'username': username,
      'email': email,
      'password': password,
    });
    return (result as Map).cast<String, dynamic>();
  }

  Future<void> logout() async {
    admin = null;
    forms = [];
    api.token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('zealflow_token');
    notifyListeners();
  }

  Future<void> refreshForms() async {
    final data = await api.get('/api/forms');
    forms = (data as List)
        .map((e) => FormSummary.fromJson(e as Map<String, dynamic>))
        .toList();
    notifyListeners();
  }

  Future<String> createForm() async {
    final id = 'form_${const Uuid().v4().substring(0, 8)}';
    final payload = {
      'id': id,
      'title': 'Untitled form',
      'schema': {
        'id': id,
        'title': 'Untitled form',
        'version': 1,
        'settings': {
          'mode': 'typeform',
          'showProgressBar': true,
          'submitLabel': 'Submit',
          'thankYouMessage': 'Thank you!',
          'allowAnonymousEntries': true,
          'deadlineAt': null,
          'timedResponseEnabled': false,
          'timedResponseSeconds': 0,
          'pages': [
            {'id': 'page_1', 'title': 'Page 1'}
          ]
        },
        'theme': {
          'preset': 'minimal',
          'primaryColor': '#4F46E5',
          'fontFamily': 'Inter',
          'customCSS': ''
        },
        'fields': [],
        'logicRules': []
      }
    };
    await api.post('/api/forms', payload);
    await refreshForms();
    return id;
  }
}

class ZealflowApi {
  ZealflowApi({required this.baseUrl});

  final String baseUrl;
  String? token;

  Future<dynamic> get(String path) => _request(path, method: 'GET');

  Future<dynamic> post(String path, Map<String, dynamic> body) =>
      _request(path, method: 'POST', body: body);

  Future<dynamic> _request(
    String path, {
    required String method,
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    late final http.Response res;
    switch (method) {
      case 'POST':
        res = await http.post(uri, headers: headers, body: jsonEncode(body ?? {}));
        break;
      case 'GET':
      default:
        res = await http.get(uri, headers: headers);
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      String detail = 'Request failed';
      try {
        final parsed = jsonDecode(res.body);
        if (parsed is Map<String, dynamic> && parsed['detail'] != null) {
          detail = parsed['detail'].toString();
        }
      } catch (_) {}
      throw Exception(detail);
    }

    if (res.body.isEmpty) return null;
    return jsonDecode(res.body);
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.controller});

  final AppController controller;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _submitting = false;
  String _error = '';
  String _success = '';
  String _verifyUrl = '';

  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _publicFormId = TextEditingController();

  @override
  void dispose() {
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _publicFormId.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = '';
      _success = '';
      _verifyUrl = '';
      _submitting = true;
    });

    try {
      if (_isLogin) {
        await widget.controller.login(_username.text.trim(), _password.text);
      } else {
        final result = await widget.controller.signup(
          _username.text.trim(),
          _email.text.trim(),
          _password.text,
        );
        setState(() {
          _success = (result['message'] ?? 'Account created').toString();
          _verifyUrl = (result['verification_url'] ?? '').toString();
          _isLogin = true;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: _screenDecoration,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 12),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.76),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: _borderWarm),
                        ),
                        child: const Text('Zealflow', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _textPrimary)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(22),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _isLogin ? 'Sign in to your workspace' : 'Create your workspace',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: _textPrimary, height: 1.1),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _isLogin ? 'Submit forms and view analytics for forms you own.' : 'Create an admin account to view your form analytics.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 14, color: _textSecondary),
                            ),
                            const SizedBox(height: 18),
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: _bgHover,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: _TabButton(
                                      label: 'Sign In',
                                      selected: _isLogin,
                                      onTap: () => setState(() {
                                        _isLogin = true;
                                        _error = '';
                                        _success = '';
                                      }),
                                    ),
                                  ),
                                  Expanded(
                                    child: _TabButton(
                                      label: 'Create Account',
                                      selected: !_isLogin,
                                      onTap: () => setState(() {
                                        _isLogin = false;
                                        _error = '';
                                        _success = '';
                                      }),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                            if (_success.isNotEmpty)
                              _NoticeCard(text: _success, color: _successColor),
                            if (_verifyUrl.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: _bgHover.withValues(alpha: 0.6),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: _borderWarm),
                                  ),
                                  child: SelectableText(
                                    'Verification URL: $_verifyUrl',
                                    style: const TextStyle(fontSize: 13, color: _textSecondary),
                                  ),
                                ),
                              ),
                            if (_error.isNotEmpty) _NoticeCard(text: _error, color: _errorColor),
                            const SizedBox(height: 4),
                            _FieldLabel(text: 'Username'),
                            TextField(
                              controller: _username,
                              decoration: const InputDecoration(hintText: 'yourname'),
                              textInputAction: _isLogin ? TextInputAction.next : TextInputAction.next,
                            ),
                            if (!_isLogin) ...[
                              const SizedBox(height: 12),
                              _FieldLabel(text: 'Email'),
                              TextField(
                                controller: _email,
                                decoration: const InputDecoration(hintText: 'you@example.com'),
                                keyboardType: TextInputType.emailAddress,
                              ),
                            ],
                            const SizedBox(height: 12),
                            _FieldLabel(text: 'Password'),
                            TextField(
                              controller: _password,
                              decoration: const InputDecoration(hintText: '••••••••'),
                              obscureText: true,
                            ),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: _submitting ? null : _submit,
                              child: Text(
                                _submitting
                                    ? (_isLogin ? 'Signing in…' : 'Creating account…')
                                    : (_isLogin ? 'Sign In' : 'Create Account'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text('Open public form', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: _textPrimary)),
                            const SizedBox(height: 4),
                            const Text('Paste a form ID to preview the stage view on mobile.', style: TextStyle(fontSize: 13, color: _textSecondary)),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _publicFormId,
                              decoration: const InputDecoration(labelText: 'Form ID', hintText: 'form_abc12345'),
                            ),
                            const SizedBox(height: 10),
                            OutlinedButton(
                              onPressed: () {
                                final formId = _publicFormId.text.trim();
                                if (formId.isEmpty) return;
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => FormRunnerScreen(
                                      api: widget.controller.api,
                                      formId: formId,
                                    ),
                                  ),
                                );
                              },
                              child: const Text('Open Form'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class RegistryScreen extends StatefulWidget {
  const RegistryScreen({super.key, required this.controller});

  final AppController controller;

  @override
  State<RegistryScreen> createState() => _RegistryScreenState();
}

class _RegistryScreenState extends State<RegistryScreen> {
  bool _busy = false;
  int _tab = 0;
  Map<String, dynamic>? _profileSummary;
  Map<String, FormAnalyticsSnapshot> _analyticsByForm = {};
  final TextEditingController _submitFormId = TextEditingController();

  Future<void> _loadProfile() async {
    final data = await widget.controller.api.get('/api/auth/profile-summary');
    if (!mounted) return;
    setState(() => _profileSummary = data as Map<String, dynamic>);
  }

  Future<void> _loadFormAnalytics() async {
    final snapshots = <String, FormAnalyticsSnapshot>{};
    final ownedForms = widget.controller.forms.where((f) => f.isOwner).toList();

    for (final form in ownedForms) {
      try {
        final raw = await widget.controller.api.get('/api/forms/${form.id}/responses');
        final payload = (raw as Map).cast<String, dynamic>();
        snapshots[form.id] = FormAnalyticsSnapshot.fromResponsesPayload(payload);
      } catch (_) {
        snapshots[form.id] = const FormAnalyticsSnapshot(responseCount: 0, lastResponseAt: null);
      }
    }

    if (!mounted) return;
    setState(() => _analyticsByForm = snapshots);
  }

  Future<void> _refreshDashboard() async {
    setState(() => _busy = true);
    try {
      await widget.controller.refreshForms();
      await _loadProfile();
      await _loadFormAnalytics();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openFormById(String formId) {
    final id = formId.trim();
    if (id.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FormRunnerScreen(api: widget.controller.api, formId: id),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _refreshDashboard();
  }

  @override
  void dispose() {
    _submitFormId.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: _screenDecoration,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _tab == 0 ? 'Analytics' : _tab == 1 ? 'Submit' : 'Settings',
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: _textPrimary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _tab == 0
                                    ? 'Performance snapshot for forms you own.'
                                    : _tab == 1
                                        ? 'Open and submit a form by ID.'
                                        : 'Mobile access details.',
                                style: const TextStyle(fontSize: 13.5, color: _textSecondary),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: _busy
                              ? null
                              : _refreshDashboard,
                          icon: const Icon(Icons.refresh),
                        ),
                        IconButton(
                          onPressed: () => widget.controller.logout(),
                          icon: const Icon(Icons.logout),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: _tab == 0
                    ? _AnalyticsTab(
                        controller: widget.controller,
                        summary: _profileSummary,
                        analyticsByForm: _analyticsByForm,
                        onOpenForm: _openFormById,
                      )
                    : _tab == 1
                        ? _SubmitTab(
                            formIdController: _submitFormId,
                            onOpenForm: _openFormById,
                          )
                        : _SettingsTab(controller: widget.controller),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: 'Analytics'),
          NavigationDestination(icon: Icon(Icons.send_outlined), selectedIcon: Icon(Icons.send), label: 'Submit'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}

class _AnalyticsTab extends StatelessWidget {
  const _AnalyticsTab({
    required this.controller,
    required this.summary,
    required this.analyticsByForm,
    required this.onOpenForm,
  });

  final AppController controller;
  final Map<String, dynamic>? summary;
  final Map<String, FormAnalyticsSnapshot> analyticsByForm;
  final void Function(String formId) onOpenForm;

  @override
  Widget build(BuildContext context) {
    if (summary == null) return const Center(child: CircularProgressIndicator());

    final formsCreated = (summary!['forms_created'] ?? 0).toString();
    final totalResponses = (summary!['total_responses'] ?? 0).toString();
    final responsesToday = (summary!['responses_today'] ?? 0).toString();
    final lastActivity = _formatDateTime(summary!['last_activity_at']?.toString());
    final ownedForms = controller.forms.where((f) => f.isOwner).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatRow(label: 'Forms created', value: formsCreated),
                _StatRow(label: 'Total responses', value: totalResponses),
                _StatRow(label: 'Responses today', value: responsesToday),
                _StatRow(label: 'Last activity', value: lastActivity),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (ownedForms.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No owned forms found yet.', style: TextStyle(color: _textSecondary)),
            ),
          )
        else
          ...ownedForms.map((form) {
            final metric = analyticsByForm[form.id] ??
                const FormAnalyticsSnapshot(responseCount: 0, lastResponseAt: null);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  title: Text(form.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _textPrimary)),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      '${form.fieldCount} fields • ${metric.responseCount} responses • Last: ${_formatDateTime(metric.lastResponseAt)}',
                      style: const TextStyle(color: _textSecondary),
                    ),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: (form.isPublished ? _successColor : _textTertiary).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      form.isPublished ? 'Published' : 'Draft',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: form.isPublished ? _successColor : _textSecondary,
                      ),
                    ),
                  ),
                  onTap: () => onOpenForm(form.id),
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _SubmitTab extends StatelessWidget {
  const _SubmitTab({required this.formIdController, required this.onOpenForm});

  final TextEditingController formIdController;
  final void Function(String formId) onOpenForm;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Submit a form', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: _textPrimary)),
              const SizedBox(height: 6),
              const Text('Enter a form ID to open the mobile submission flow.', style: TextStyle(color: _textSecondary)),
              const SizedBox(height: 14),
              TextField(
                controller: formIdController,
                decoration: const InputDecoration(labelText: 'Form ID', hintText: 'form_abc12345'),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => onOpenForm(formIdController.text),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Open form'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  final local = date.toLocal();
  final month = _monthShort(local.month);
  final two = local.minute.toString().padLeft(2, '0');
  return '${local.day} $month ${local.year}, ${local.hour}:$two';
}

String _monthShort(int month) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  if (month < 1 || month > 12) return '—';
  return months[month - 1];
}

class FormAnalyticsSnapshot {
  const FormAnalyticsSnapshot({required this.responseCount, required this.lastResponseAt});

  final int responseCount;
  final String? lastResponseAt;

  factory FormAnalyticsSnapshot.fromResponsesPayload(Map<String, dynamic> payload) {
    final responses = (payload['responses'] as List?) ?? const [];
    String? last;
    if (responses.isNotEmpty) {
      final first = responses.first;
      if (first is Map<String, dynamic>) {
        last = first['submitted_at']?.toString();
      } else if (first is Map) {
        last = first['submitted_at']?.toString();
      }
    }
    return FormAnalyticsSnapshot(responseCount: responses.length, lastResponseAt: last);
  }
}

class _SettingsTab extends StatelessWidget {
  const _SettingsTab({required this.controller});

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        Card(
          child: ListTile(
            title: const Text('API Base URL'),
            subtitle: Text(controller.api.baseUrl),
          ),
        ),
        const Card(
          child: ListTile(
            title: Text('Mobile scope'),
            subtitle: Text('Mobile supports form submissions and admin analytics for owned forms.'),
          ),
        )
      ],
    );
  }
}

class FormRunnerScreen extends StatefulWidget {
  const FormRunnerScreen({super.key, required this.api, required this.formId});

  final ZealflowApi api;
  final String formId;

  @override
  State<FormRunnerScreen> createState() => _FormRunnerScreenState();
}

class _FormRunnerScreenState extends State<FormRunnerScreen> {
  FormSchema? _schema;
  String _status = 'loading';
  String _error = '';
  bool _submitted = false;
  List<String> _pageTrail = [];
  String? _deadlineAt;
  bool _closedByDeadline = false;

  final Map<String, dynamic> _answers = {};
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final Map<String, TextEditingController> _textControllers = {};

  bool _submitting = false;
  String _submitError = '';

  bool _timedEnabled = false;
  int _timedSeconds = 0;
  int _remaining = 0;
  String? _sessionToken;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _nameController.dispose();
    _emailController.dispose();
    for (final c in _textControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _controllerFor(String key, [String initial = '']) {
    return _textControllers.putIfAbsent(key, () => TextEditingController(text: initial));
  }

  Future<void> _load() async {
    setState(() {
      _status = 'loading';
      _error = '';
      _submitted = false;
      _submitError = '';
    });

    try {
      final raw = await widget.api.get('/api/forms/${widget.formId}');
      final schemaRaw = (raw is Map<String, dynamic> ? (raw['schema'] ?? raw) : raw) as Map<String, dynamic>;
      final schema = FormSchema.fromJson(schemaRaw);
      final deadlineAt = schema.settings.deadlineAt;
      final isClosed = deadlineAt != null && DateTime.tryParse(deadlineAt)?.isBefore(DateTime.now()) == true;

      _schema = schema;
      _deadlineAt = deadlineAt;
      _closedByDeadline = isClosed;
        final pages = schema.settings.pages.isEmpty
          ? [const FormPage(id: 'page_1', title: 'Page 1')]
          : schema.settings.pages;
        _pageTrail = pages.first.id.isNotEmpty ? [pages.first.id] : [];

      if (!_closedByDeadline) {
        await _openSession(schema);
      }

      if (!mounted) return;
      setState(() => _status = 'ready');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _status = 'error';
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _openSession(FormSchema schema) async {
    final timedEnabled = schema.settings.timedResponseEnabled;
    final timedSeconds = schema.settings.timedResponseSeconds;

    if (!timedEnabled || timedSeconds <= 0) {
      await _clearTimedCache();
      final opened = await widget.api.post('/api/forms/${widget.formId}/open', {});
      _setTimedStateFromOpen(opened as Map<String, dynamic>);
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final key = 'zealflow_timed_session_${widget.formId}';
    final cached = prefs.getString(key);
    if (cached != null && cached.isNotEmpty) {
      try {
        final parsed = jsonDecode(cached) as Map<String, dynamic>;
        final startedAt = (parsed['startedAt'] ?? 0) as int;
        final seconds = (parsed['seconds'] ?? 0) as int;
        final token = (parsed['token'] ?? '').toString();
        if (token.isNotEmpty && seconds == timedSeconds && startedAt > 0) {
          final elapsed = (DateTime.now().millisecondsSinceEpoch ~/ 1000) - startedAt;
          _timedEnabled = true;
          _timedSeconds = timedSeconds;
          _remaining = (timedSeconds - elapsed).clamp(0, timedSeconds);
          _sessionToken = token;
          _startTimer();
          return;
        }
      } catch (_) {}
    }

    final opened = await widget.api.post('/api/forms/${widget.formId}/open', {});
    _setTimedStateFromOpen(opened as Map<String, dynamic>);
    if (_timedEnabled && _sessionToken != null) {
      await prefs.setString(
        key,
        jsonEncode({
          'token': _sessionToken,
          'startedAt': opened['started_at'],
          'seconds': _timedSeconds,
        }),
      );
    }
  }

  void _setTimedStateFromOpen(Map<String, dynamic> data) {
    _timedEnabled = (data['timed_enabled'] ?? false) as bool;
    _timedSeconds = (data['timed_seconds'] ?? 0) as int;
    _remaining = _timedSeconds;
    _sessionToken = data['session_token']?.toString();
    _deadlineAt = data['deadline_at']?.toString() ?? _deadlineAt;
    if (_timedEnabled && _timedSeconds > 0) {
      _startTimer();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || !_timedEnabled) return;
      if (_remaining <= 0) return;
      setState(() => _remaining -= 1);
    });
  }

  Future<void> _clearTimedCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('zealflow_timed_session_${widget.formId}');
  }

  bool _isEmpty(dynamic value) {
    if (value == null) return true;
    if (value is String) return value.trim().isEmpty;
    if (value is List) return value.isEmpty;
    return false;
  }

  dynamic _normalizeRuleValue(dynamic value) {
    if (value == null) return '';
    if (value is List) return value.map((e) => e.toString()).toList();
    return value.toString();
  }

  bool _evaluateRuleConditions(LogicRule rule) {
    if (rule.conditions.isEmpty) return false;

    final results = rule.conditions.map((condition) {
      final answer = _answers[condition.fieldId];
      if (answer == null) return false;

      final expected = condition.value ?? '';
      final normalizedAnswer = _normalizeRuleValue(answer);

      switch (condition.operator) {
        case 'equals':
          if (normalizedAnswer is List<String>) {
            return normalizedAnswer.contains(expected.toString());
          }
          return normalizedAnswer == expected.toString();
        case 'not_equals':
          if (normalizedAnswer is List<String>) {
            return !normalizedAnswer.contains(expected.toString());
          }
          return normalizedAnswer != expected.toString();
        case 'contains':
          if (normalizedAnswer is List<String>) {
            return normalizedAnswer.contains(expected.toString());
          }
          return normalizedAnswer
              .toString()
              .toLowerCase()
              .contains(expected.toString().toLowerCase());
        case 'greater_than':
          return (num.tryParse(answer.toString()) ?? 0) >
              (num.tryParse(expected.toString()) ?? 0);
        case 'less_than':
          return (num.tryParse(answer.toString()) ?? 0) <
              (num.tryParse(expected.toString()) ?? 0);
        default:
          return false;
      }
    }).toList();

    return rule.conditionOperator == 'OR'
        ? results.any((v) => v)
        : results.every((v) => v);
  }

  Map<String, bool> _visibilityMap(FormSchema schema) {
    final map = <String, bool>{};
    for (final field in schema.fields) {
      map[field.id] = !(field.meta['hidden'] == true);
    }

    for (final rule in schema.logicRules) {
      final isMatch = _evaluateRuleConditions(rule);

      if (isMatch && map.containsKey(rule.action.targetFieldId)) {
        if (rule.action.type == 'show') {
          map[rule.action.targetFieldId] = true;
        } else if (rule.action.type == 'hide') {
          map[rule.action.targetFieldId] = false;
        }
      }
    }

    return map;
  }

  String? _sequentialNextPageId(List<FormPage> pages, String currentPageId) {
    final idx = pages.indexWhere((p) => p.id == currentPageId);
    if (idx == -1) return pages.isEmpty ? null : pages.first.id;
    if (idx + 1 >= pages.length) return null;
    return pages[idx + 1].id;
  }

  String? _resolveNextPageId(FormSchema schema, List<FormPage> pages, String currentPageId) {
    for (final rule in schema.logicRules) {
      if (rule.action.type != 'jump_to_page') continue;
      final sourcePageId = rule.action.sourcePageId;
      if (sourcePageId != null && sourcePageId.isNotEmpty && sourcePageId != currentPageId) {
        continue;
      }

      final targetPageId = rule.action.targetPageId;
      if (targetPageId == null || targetPageId.isEmpty || targetPageId == currentPageId) {
        continue;
      }

      if (_evaluateRuleConditions(rule) && pages.any((p) => p.id == targetPageId)) {
        return targetPageId;
      }
    }

    return _sequentialNextPageId(pages, currentPageId);
  }

  List<String> _buildForwardPath(FormSchema schema, List<FormPage> pages, String startPageId) {
    if (startPageId.isEmpty) return const [];
    final path = <String>[];
    final visited = <String>{};
    var current = startPageId;
    var guard = 0;

    while (current.isNotEmpty && guard < 100) {
      path.add(current);
      visited.add(current);
      final next = _resolveNextPageId(schema, pages, current);
      if (next == null || visited.contains(next)) break;
      current = next;
      guard += 1;
    }

    return path;
  }

  Future<void> _submit(
    FormSchema schema,
    List<FormField> currentPageFields,
    bool isLastPage,
    String? nextPageId,
  ) async {
    setState(() => _submitError = '');

    for (final field in currentPageFields) {
      if (field.required && _isEmpty(_answers[field.id])) {
        setState(() => _submitError = 'Please complete required field: ${field.label}');
        return;
      }
    }

    if (!isLastPage) {
      if (nextPageId != null && nextPageId.isNotEmpty) {
        setState(() {
          if (_pageTrail.contains(nextPageId)) {
            final idx = _pageTrail.indexOf(nextPageId);
            _pageTrail = _pageTrail.sublist(0, idx + 1);
          } else {
            _pageTrail = [..._pageTrail, nextPageId];
          }
        });
      }
      return;
    }

    if (_timedEnabled && _remaining <= 0) {
      setState(() => _submitError = 'Time limit exceeded for this form.');
      return;
    }

    if (!schema.settings.allowAnonymousEntries) {
      if (_nameController.text.trim().isEmpty || _emailController.text.trim().isEmpty) {
        setState(() => _submitError = 'Please provide your name and email to continue.');
        return;
      }
    }

    setState(() => _submitting = true);
    try {
      final meta = <String, dynamic>{};
      if (!schema.settings.allowAnonymousEntries) {
        meta['submitter_name'] = _nameController.text.trim();
        meta['submitter_email'] = _emailController.text.trim();
      }
      if (_sessionToken != null && _sessionToken!.isNotEmpty) {
        meta['session_token'] = _sessionToken;
      }

      await widget.api.post('/api/forms/${widget.formId}/submit', {
        'data': _answers,
        'meta': meta,
      });
      await _clearTimedCache();
      if (!mounted) return;
      setState(() => _submitted = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitError = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_status == 'loading') return const LoadingScreen(label: 'Loading form…');

    if (_status == 'error' || _schema == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Form not found')),
        body: Container(
          decoration: _screenDecoration,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    _error.isEmpty ? 'This form is invalid or unavailable.' : _error,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: _textSecondary),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    if (_closedByDeadline) {
      return Scaffold(
        appBar: AppBar(title: const Text('Form closed')),
        body: Container(
          decoration: _screenDecoration,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Form Closed', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: _textPrimary)),
                      const SizedBox(height: 8),
                      const Text('This form is no longer accepting responses.', textAlign: TextAlign.center, style: TextStyle(color: _textSecondary)),
                      if (_deadlineAt != null) ...[
                        const SizedBox(height: 8),
                        Text('Deadline: $_deadlineAt', style: const TextStyle(fontSize: 12, color: _textTertiary)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    if (_submitted) {
      return Scaffold(
        appBar: AppBar(title: const Text('Submitted')),
        body: Container(
          decoration: _screenDecoration,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle, color: _successColor, size: 64),
                      const SizedBox(height: 10),
                      Text(_schema!.settings.thankYouMessage, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: _textPrimary), textAlign: TextAlign.center),
                      const SizedBox(height: 8),
                      const Text('Your response was recorded.', style: TextStyle(color: _textSecondary)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    final schema = _schema!;
    final visibility = _visibilityMap(schema);
    final visibleFields = schema.fields.where((f) => visibility[f.id] == true).toList();
    final pages = schema.settings.pages.isEmpty ? [const FormPage(id: 'page_1', title: 'Page 1')] : schema.settings.pages;
    final sanitizedTrail = _pageTrail.where((id) => pages.any((p) => p.id == id)).toList();
    final currentPageId = sanitizedTrail.isNotEmpty ? sanitizedTrail.last : pages.first.id;
    final currentPage = pages.firstWhere(
      (p) => p.id == currentPageId,
      orElse: () => pages.first,
    );
    final nextPageId = _resolveNextPageId(schema, pages, currentPage.id);
    final currentPageFields = visibleFields
      .where((f) => (f.meta['pageId']?.toString() ?? pages.first.id) == currentPage.id)
      .toList();
    final isLastPage = nextPageId == null;

    final forwardPath = _buildForwardPath(schema, pages, currentPage.id);
    final completedBeforeCurrent = sanitizedTrail.isEmpty ? 0 : sanitizedTrail.length - 1;
    final logicalTotalPages = (completedBeforeCurrent + forwardPath.length).clamp(1, 1000);
    final logicalCurrentPage = (completedBeforeCurrent + 1).clamp(1, logicalTotalPages);

    return Scaffold(
      appBar: AppBar(title: Text(schema.title)),
      body: Container(
        decoration: _screenDecoration,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          children: [
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(schema.title, style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w700, color: _textPrimary)),
                    const SizedBox(height: 18),
                    if (_deadlineAt != null || _timedEnabled)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          [if (_deadlineAt != null) 'Deadline: $_deadlineAt', if (_timedEnabled) 'Time remaining: ${_remaining ~/ 60}:${(_remaining % 60).toString().padLeft(2, '0')}'].join(' • '),
                          style: const TextStyle(fontSize: 12.5, color: _textSecondary),
                        ),
                      ),
                    if (pages.length > 1) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            currentPage.title,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _textSecondary),
                          ),
                          Text(
                            'Page $logicalCurrentPage / $logicalTotalPages',
                            style: const TextStyle(fontSize: 12, color: _textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(value: logicalCurrentPage / logicalTotalPages, minHeight: 6),
                      ),
                      const SizedBox(height: 20),
                    ],
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (currentPageFields.isEmpty)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 8),
                                child: Text('No visible questions on this page.', style: TextStyle(color: _textSecondary, fontStyle: FontStyle.italic)),
                              ),
                            for (final field in currentPageFields) ...[
                              Text(field.label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _textPrimary)),
                              const SizedBox(height: 12),
                              _FieldRenderer(
                                field: field,
                                value: _answers[field.id],
                                controller: _controllerFor(field.id, _answers[field.id]?.toString() ?? ''),
                                onChanged: (v) => setState(() => _answers[field.id] = v),
                              ),
                              if (field.required)
                                const Padding(
                                  padding: EdgeInsets.only(top: 6),
                                  child: Text('* Required', style: TextStyle(fontSize: 12, color: _accent)),
                                ),
                              const SizedBox(height: 22),
                            ],
                            if (!schema.settings.allowAnonymousEntries && isLastPage) ...[
                              const Divider(height: 28),
                              const Text('This form requires respondent details.', style: TextStyle(fontSize: 13, color: _textSecondary)),
                              const SizedBox(height: 12),
                              TextField(controller: _nameController, decoration: const InputDecoration(hintText: 'Your name')),
                              const SizedBox(height: 10),
                              TextField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(hintText: 'Your email'),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if (_submitError.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Text(_submitError, style: const TextStyle(color: _errorColor)),
                              ),
                            Row(
                              children: [
                                if (sanitizedTrail.length > 1)
                                  OutlinedButton(
                                    onPressed: () {
                                      setState(() {
                                        if (_pageTrail.length > 1) {
                                          _pageTrail = _pageTrail.sublist(0, _pageTrail.length - 1);
                                        }
                                      });
                                    },
                                    child: const Text('Back'),
                                  ),
                                if (sanitizedTrail.length > 1) const SizedBox(width: 12),
                                Expanded(
                                  child: FilledButton(
                                    onPressed: _submitting || (_timedEnabled && _remaining <= 0)
                                        ? null
                                        : () => _submit(schema, currentPageFields, isLastPage, nextPageId),
                                    child: Text(
                                      _submitting
                                          ? 'Submitting…'
                                          : isLastPage
                                              ? schema.settings.submitLabel
                                              : 'Next',
                                    ),
                                  ),
                                )
                              ],
                            )
                          ],
                        ),
                      ),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldRenderer extends StatelessWidget {
  const _FieldRenderer({
    required this.field,
    required this.value,
    required this.controller,
    required this.onChanged,
  });

  final FormField field;
  final dynamic value;
  final TextEditingController controller;
  final ValueChanged<dynamic> onChanged;

  List<String> _options() {
    final raw = field.meta['options'];
    if (raw is List) {
      return raw.map((e) => e.toString()).toList();
    }
    return const ['Option 1', 'Option 2'];
  }

  @override
  Widget build(BuildContext context) {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return TextField(
          controller: controller,
          keyboardType: field.type == 'number'
              ? TextInputType.number
              : field.type == 'email'
                  ? TextInputType.emailAddress
                  : TextInputType.text,
          decoration: InputDecoration(hintText: field.placeholder),
          onChanged: onChanged,
        );

      case 'longtext':
        return TextField(
          controller: controller,
          maxLines: 5,
          decoration: InputDecoration(hintText: field.placeholder),
          onChanged: onChanged,
        );

      case 'choice':
        final options = _options();
        return Column(
          children: options
              .map(
                (opt) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () => onChanged(opt),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                      decoration: BoxDecoration(
                        color: value?.toString() == opt ? _bgBase : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: value?.toString() == opt ? _textPrimary : _borderWarm),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            value?.toString() == opt ? Icons.radio_button_checked : Icons.radio_button_off,
                            size: 18,
                            color: value?.toString() == opt ? _textPrimary : _textTertiary,
                          ),
                          const SizedBox(width: 10),
                          Text(opt, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _textPrimary)),
                        ],
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        );

      case 'checkbox':
        final options = _options();
        final current = (value is List) ? value.map((e) => e.toString()).toSet() : <String>{};
        return Column(
          children: options
              .map(
                (opt) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () {
                      final next = Set<String>.from(current);
                      if (next.contains(opt)) {
                        next.remove(opt);
                      } else {
                        next.add(opt);
                      }
                      onChanged(next.toList());
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                      decoration: BoxDecoration(
                        color: current.contains(opt) ? _bgBase : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: current.contains(opt) ? _textPrimary : _borderWarm),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            current.contains(opt) ? Icons.check_box : Icons.check_box_outline_blank,
                            size: 18,
                            color: current.contains(opt) ? _textPrimary : _textTertiary,
                          ),
                          const SizedBox(width: 10),
                          Text(opt, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _textPrimary)),
                        ],
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        );

      case 'binary':
        final left = field.meta['leftLabel']?.toString() ?? 'Yes';
        final right = field.meta['rightLabel']?.toString() ?? 'No';
        return Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => onChanged(left),
                style: OutlinedButton.styleFrom(
                  backgroundColor: value == left ? _textPrimary : Colors.white,
                  foregroundColor: value == left ? Colors.white : _textSecondary,
                  side: BorderSide(color: value == left ? _textPrimary : _borderWarm),
                ),
                child: Text(left),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                onPressed: () => onChanged(right),
                style: OutlinedButton.styleFrom(
                  backgroundColor: value == right ? _textPrimary : Colors.white,
                  foregroundColor: value == right ? Colors.white : _textSecondary,
                  side: BorderSide(color: value == right ? _textPrimary : _borderWarm),
                ),
                child: Text(right),
              ),
            ),
          ],
        );

      case 'rating':
        final max = (field.meta['max'] as num?)?.toInt() ?? 5;
        final mode = field.meta['mode']?.toString() ?? 'stars';
        if (mode == 'nps') {
          return Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(max, (i) {
              final n = i + 1;
              final selected = value == n;
              return ChoiceChip(
                label: Text('$n'),
                selected: selected,
                selectedColor: _textPrimary,
                labelStyle: TextStyle(color: selected ? Colors.white : _textSecondary, fontWeight: FontWeight.w600),
                onSelected: (_) => onChanged(n),
              );
            }),
          );
        }
        final current = (value is num) ? value.toInt() : 0;
        return Row(
          children: List.generate(max, (i) {
            final n = i + 1;
            return IconButton(
              onPressed: () => onChanged(n),
              icon: Icon(
                n <= current ? Icons.star : Icons.star_border,
                color: n <= current ? _accent : _borderWarm,
              ),
            );
          }),
        );

      case 'opinion':
        final left = field.meta['leftLabel']?.toString() ?? 'Strongly Disagree';
        final right = field.meta['rightLabel']?.toString() ?? 'Strongly Agree';
        return Column(
          children: [
            Wrap(
              spacing: 8,
              children: List.generate(5, (i) {
                final n = i + 1;
                return ChoiceChip(
                  label: Text('$n'),
                  selected: value == n,
                  selectedColor: _textPrimary,
                  labelStyle: TextStyle(color: value == n ? Colors.white : _textSecondary, fontWeight: FontWeight.w600),
                  onSelected: (_) => onChanged(n),
                );
              }),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [Text(left), Text(right)],
            )
          ],
        );

      case 'date':
        return OutlinedButton.icon(
          onPressed: () async {
            final now = DateTime.now();
            final selected = await showDatePicker(
              context: context,
              firstDate: DateTime(now.year - 100),
              lastDate: DateTime(now.year + 50),
              initialDate: DateTime.tryParse(value?.toString() ?? '') ?? now,
            );
            if (selected != null) {
              onChanged(selected.toIso8601String().split('T').first);
            }
          },
          icon: const Icon(Icons.calendar_month),
          label: Text(value?.toString() ?? field.placeholder),
        );

      case 'image':
        final url = field.meta['url']?.toString() ?? '';
        if (url.isEmpty) return const Text('No image provided in blueprint.');
        return ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Image.network(url, fit: BoxFit.cover, errorBuilder: (_, _, _) => const Text('Image failed to load.')),
        );

      case 'upload':
        return TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'File upload on mobile: enter file name / URL',
          ),
          onChanged: onChanged,
        );

      default:
        return TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'Type your answer…'),
          onChanged: onChanged,
        );
    }
  }
}

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 12),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.text, required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(text, style: TextStyle(color: color)),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: selected
              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 12, offset: const Offset(0, 4))]
              : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: selected ? _textPrimary : _textSecondary,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: _textSecondary,
        ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: _textSecondary),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 10),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700, color: _textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

class AdminUser {
  const AdminUser({required this.id, required this.username, required this.email});

  final String id;
  final String username;
  final String email;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: (json['id'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
    );
  }
}

class FormSummary {
  const FormSummary({
    required this.id,
    required this.title,
    required this.isPublished,
    required this.fieldCount,
    required this.version,
    required this.isOwner,
  });

  final String id;
  final String title;
  final bool isPublished;
  final int fieldCount;
  final int version;
  final bool isOwner;

  factory FormSummary.fromJson(Map<String, dynamic> json) {
    final schema = (json['schema'] is Map<String, dynamic>) ? json['schema'] as Map<String, dynamic> : <String, dynamic>{};
    return FormSummary(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? 'Untitled form').toString(),
      isPublished: (json['is_published'] ?? false) as bool,
      fieldCount: (json['field_count'] as num?)?.toInt() ?? ((schema['fields'] as List?)?.length ?? 0),
      version: (json['version'] as num?)?.toInt() ?? ((schema['version'] as num?)?.toInt() ?? 1),
      isOwner: (json['is_owner'] ?? true) as bool,
    );
  }
}

class FormSchema {
  const FormSchema({
    required this.title,
    required this.settings,
    required this.fields,
    required this.logicRules,
  });

  final String title;
  final FormSettings settings;
  final List<FormField> fields;
  final List<LogicRule> logicRules;

  factory FormSchema.fromJson(Map<String, dynamic> json) {
    return FormSchema(
      title: (json['title'] ?? 'Untitled form').toString(),
      settings: FormSettings.fromJson((json['settings'] as Map<String, dynamic>?) ?? <String, dynamic>{}),
      fields: ((json['fields'] as List?) ?? const [])
          .map((e) => FormField.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
      logicRules: ((json['logicRules'] as List?) ?? const [])
          .map((e) => LogicRule.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}

class FormSettings {
  const FormSettings({
    required this.submitLabel,
    required this.thankYouMessage,
    required this.allowAnonymousEntries,
    required this.deadlineAt,
    required this.timedResponseEnabled,
    required this.timedResponseSeconds,
    required this.pages,
  });

  final String submitLabel;
  final String thankYouMessage;
  final bool allowAnonymousEntries;
  final String? deadlineAt;
  final bool timedResponseEnabled;
  final int timedResponseSeconds;
  final List<FormPage> pages;

  factory FormSettings.fromJson(Map<String, dynamic> json) {
    return FormSettings(
      submitLabel: (json['submitLabel'] ?? 'Submit').toString(),
      thankYouMessage: (json['thankYouMessage'] ?? 'Thank you!').toString(),
      allowAnonymousEntries: (json['allowAnonymousEntries'] ?? true) as bool,
      deadlineAt: json['deadlineAt']?.toString(),
      timedResponseEnabled: (json['timedResponseEnabled'] ?? false) as bool,
      timedResponseSeconds: (json['timedResponseSeconds'] as num?)?.toInt() ?? 0,
      pages: ((json['pages'] as List?) ?? const [])
          .map((e) => FormPage.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}

class FormPage {
  const FormPage({required this.id, required this.title});

  final String id;
  final String title;

  factory FormPage.fromJson(Map<String, dynamic> json) {
    return FormPage(
      id: (json['id'] ?? 'page_1').toString(),
      title: (json['title'] ?? 'Page 1').toString(),
    );
  }
}

class FormField {
  const FormField({
    required this.id,
    required this.type,
    required this.label,
    required this.placeholder,
    required this.required,
    required this.meta,
  });

  final String id;
  final String type;
  final String label;
  final String placeholder;
  final bool required;
  final Map<String, dynamic> meta;

  factory FormField.fromJson(Map<String, dynamic> json) {
    return FormField(
      id: (json['id'] ?? '').toString(),
      type: (json['type'] ?? 'text').toString(),
      label: (json['label'] ?? 'Untitled question').toString(),
      placeholder: (json['placeholder'] ?? '').toString(),
      required: (json['required'] ?? false) as bool,
      meta: ((json['meta'] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>(),
    );
  }
}

class LogicRule {
  const LogicRule({
    required this.conditions,
    required this.conditionOperator,
    required this.action,
  });

  final List<LogicCondition> conditions;
  final String conditionOperator;
  final LogicAction action;

  factory LogicRule.fromJson(Map<String, dynamic> json) {
    return LogicRule(
      conditions: ((json['conditions'] as List?) ?? const [])
          .map((e) => LogicCondition.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
      conditionOperator: (json['conditionOperator'] ?? 'AND').toString(),
      action: LogicAction.fromJson(((json['action'] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>()),
    );
  }
}

class LogicCondition {
  const LogicCondition({
    required this.fieldId,
    required this.operator,
    required this.value,
  });

  final String fieldId;
  final String operator;
  final dynamic value;

  factory LogicCondition.fromJson(Map<String, dynamic> json) {
    return LogicCondition(
      fieldId: (json['fieldId'] ?? '').toString(),
      operator: (json['operator'] ?? '').toString(),
      value: json['value'],
    );
  }
}

class LogicAction {
  const LogicAction({
    required this.type,
    required this.targetFieldId,
    this.sourcePageId,
    this.targetPageId,
  });

  final String type;
  final String targetFieldId;
  final String? sourcePageId;
  final String? targetPageId;

  factory LogicAction.fromJson(Map<String, dynamic> json) {
    return LogicAction(
      type: (json['type'] ?? '').toString(),
      targetFieldId: (json['targetFieldId'] ?? '').toString(),
      sourcePageId: json['sourcePageId']?.toString(),
      targetPageId: json['targetPageId']?.toString(),
    );
  }
}
