export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const { type = 'growth', student = {} } = req.body || {};
  const templateName = {
    growth: '성장 스토리: 지난달 → 이번 달 → 다음 목표',
    weekly: '주간 체크: 단어·리딩·리스닝·스피킹 변화',
    classic: '클래식 리포트: 점수 변화, 학습 내용, 선생님 코멘트'
  }[type] || '성장 스토리';

  const prompt = `억매방 초등 영어 학원 학부모용 보고서를 한국어로 작성하세요.\n\n보고서 양식: ${templateName}\n\n학생 정보:\n${JSON.stringify(student, null, 2)}\n\n규칙:\n- 초등학생 학부모가 이해하기 쉽게 작성하세요.\n- 전화번호 같은 개인정보는 쓰지 마세요.\n- 카카오톡으로 바로 보낼 수 있게 자연스럽게 작성하세요.\n- 과장하지 말고 실제 점수와 학습 내용을 바탕으로 작성하세요.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        input: prompt,
        max_output_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed' });
    }

    const report = data.output_text || (data.output || [])
      .flatMap((item) => item.content || [])
      .map((content) => content.text || '')
      .join('\n')
      .trim();

    return res.status(200).json({ report });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
