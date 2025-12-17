#!/usr/bin/env python3

"""
Report Generator - Creates beautiful HTML report from PromptFoo results

Usage: python scripts/report_generator.py

Reads: ai-evaluation/promptfoo-results.json
Outputs: ai-evaluation/report.html
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def load_results():
    """Load PromptFoo evaluation results"""
    result_file = Path('ai-evaluation/promptfoo-results.json')
    
    if not result_file.exists():
        print(f"❌ Error: {result_file} not found")
        print("   Run: npx promptfoo eval")
        sys.exit(1)
    
    with open(result_file, 'r') as f:
        return json.load(f)

def calculate_stats(results):
    """Calculate statistics from results"""
    total = len(results.get('results', []))
    passed = sum(1 for r in results.get('results', []) if r.get('pass', False))
    failed = total - passed
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    # Calculate metric averages
    metrics = {}
    for result in results.get('results', []):
        for key, value in result.get('scores', {}).items():
            if key not in metrics:
                metrics[key] = {'sum': 0, 'count': 0}
            if isinstance(value, (int, float)):
                metrics[key]['sum'] += value
                metrics[key]['count'] += 1
    
    metric_averages = {}
    for key, data in metrics.items():
        if data['count'] > 0:
            metric_averages[key] = data['sum'] / data['count']
    
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'pass_rate': pass_rate,
        'metric_averages': metric_averages
    }

def generate_html(results, stats):
    """Generate beautiful HTML report"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>U-Ask AI Validation Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        
        .content {{
            padding: 40px;
        }}
        
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        .card {{
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            transition: transform 0.3s;
        }}
        
        .card:hover {{
            transform: translateY(-5px);
        }}
        
        .card h3 {{
            color: #333;
            margin-bottom: 10px;
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .card .value {{
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }}
        
        .card.pass {{
            border-left-color: #28a745;
        }}
        
        .card.pass .value {{
            color: #28a745;
        }}
        
        .card.fail {{
            border-left-color: #dc3545;
        }}
        
        .card.fail .value {{
            color: #dc3545;
        }}
        
        .metrics {{
            margin-bottom: 40px;
        }}
        
        .metrics h2 {{
            color: #333;
            margin-bottom: 25px;
            font-size: 1.8em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        .metric-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }}
        
        .metric {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        
        .metric h4 {{
            color: #666;
            margin-bottom: 15px;
            font-size: 0.95em;
            text-transform: uppercase;
        }}
        
        .metric-value {{
            font-size: 2.2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }}
        
        .metric-bar {{
            background: #e0e0e0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
        }}
        
        .metric-bar-fill {{
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s;
        }}
        
        .results {{
            margin-top: 40px;
        }}
        
        .results h2 {{
            color: #333;
            margin-bottom: 25px;
            font-size: 1.8em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}
        
        th {{
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }}
        
        td {{
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        tr:hover {{
            background: #f8f9fa;
        }}
        
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        .badge.pass {{
            background: #d4edda;
            color: #155724;
        }}
        
        .badge.fail {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .badge.en {{
            background: #d1ecf1;
            color: #0c5460;
        }}
        
        .badge.ar {{
            background: #e7d4f5;
            color: #5a3a7a;
        }}
        
        .footer {{
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e0e0e0;
        }}
        
        .progress-bar {{
            width: 100%;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin-top: 20px;
        }}
        
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            transition: width 0.5s;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 U-Ask AI Response Validation</h1>
            <p>PromptFoo Evaluation Report with GPT-4</p>
        </div>
        
        <div class="content">
            <!-- Summary Cards -->
            <div class="summary">
                <div class="card">
                    <h3>Total Tests</h3>
                    <div class="value">{stats['total']}</div>
                </div>
                <div class="card pass">
                    <h3>Passed</h3>
                    <div class="value">{stats['passed']}</div>
                </div>
                <div class="card fail">
                    <h3>Failed</h3>
                    <div class="value">{stats['failed']}</div>
                </div>
                <div class="card">
                    <h3>Pass Rate</h3>
                    <div class="value">{stats['pass_rate']:.1f}%</div>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="progress-bar">
                <div class="progress-fill" style="width: {stats['pass_rate']:.1f}%">
                    {stats['pass_rate']:.1f}% Pass
                </div>
            </div>
            
            <!-- Metrics Section -->
            <div class="metrics">
                <h2>📊 Evaluation Metrics</h2>
                <div class="metric-grid">
"""
    
    # Add metrics
    metric_names = {
        'clarity': '✨ Clarity',
        'hallucination': '🚨 Hallucination',
        'formatting': '📝 Formatting',
        'fallback': '🛡️ Fallback',
        'bilingual': '🌐 Bilingual',
        'consistency': '🔄 Consistency'
    }
    
    for key, name in metric_names.items():
        if key in stats['metric_averages']:
            value = stats['metric_averages'][key]
            percentage = (value / 4 * 100) if value <= 4 else 100
            html += f"""
                <div class="metric">
                    <h4>{name}</h4>
                    <div class="metric-value">{value:.2f}</div>
                    <div class="metric-bar">
                        <div class="metric-bar-fill" style="width: {percentage:.1f}%"></div>
                    </div>
                </div>
"""
    
    html += """
                </div>
            </div>
            
            <!-- Results Table -->
            <div class="results">
                <h2>📋 Detailed Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Language</th>
                            <th>Clarity</th>
                            <th>Hallucination</th>
                            <th>Formatting</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
"""
    
    # Add results rows
    for result in results.get('results', []):
        test_id = result.get('id', 'N/A')
        metadata = result.get('metadata', {})
        language = metadata.get('language', 'en')
        scores = result.get('scores', {})
        
        clarity = scores.get('clarity', 'N/A')
        hallucination = scores.get('hallucination', 'N/A')
        formatting = scores.get('formatting', 'N/A')
        passed = result.get('pass', False)
        
        status = '<span class="badge pass">✓ PASS</span>' if passed else '<span class="badge fail">✗ FAIL</span>'
        lang_badge = f'<span class="badge {language}">{language.upper()}</span>'
        
        clarity_str = f"{clarity:.2f}" if isinstance(clarity, (int, float)) else clarity
        hallucination_str = f"{hallucination:.2f}" if isinstance(hallucination, (int, float)) else hallucination
        formatting_str = f"{formatting:.2f}" if isinstance(formatting, (int, float)) else formatting
        
        html += f"""
                        <tr>
                            <td>{test_id}</td>
                            <td>{lang_badge}</td>
                            <td>{clarity_str}</td>
                            <td>{hallucination_str}</td>
                            <td>{formatting_str}</td>
                            <td>{status}</td>
                        </tr>
"""
    
    html += f"""
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated: {timestamp} | U-Ask Chatbot AI Validation Report</p>
        </div>
    </div>
</body>
</html>
"""
    
    return html

def main():
    print('📊 Report Generator - Creating HTML Report\n')
    
    # Load results
    print('📖 Loading evaluation results...')
    results = load_results()
    print('✅ Results loaded\n')
    
    # Calculate stats
    print('📈 Calculating statistics...')
    stats = calculate_stats(results)
    print('✅ Statistics calculated\n')
    
    # Generate HTML
    print('🎨 Generating HTML report...')
    html = generate_html(results, stats)
    
    # Save report
    output_file = Path('ai-evaluation/report.html')
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w') as f:
        f.write(html)
    
    print(f'✅ Report saved to: {output_file}\n')
    
    # Print summary
    print('📊 Summary:')
    print(f'   Total Tests: {stats["total"]}')
    print(f'   Passed: {stats["passed"]}')
    print(f'   Failed: {stats["failed"]}')
    print(f'   Pass Rate: {stats["pass_rate"]:.1f}%\n')

if __name__ == '__main__':
    main()
