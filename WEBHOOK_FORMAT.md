# PolyRadar Webhook Integration

## Отправка запроса на анализ (из фронтенда на Make.com)

**URL:** `https://hook.us2.make.com/mio87mwc00gx78v2wo1ex41xwzhrmpd5`

**Метод:** POST

**Формат запроса:**
```json
{
  "polymarket_url": "https://polymarket.com/event/will-trump-win-2024",
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Получение результатов анализа (от Make.com на бекенд)

### Успешный анализ

**URL:** `https://your-domain.com/api/webhooks/analysis-result`

**Метод:** POST

**Формат запроса:**
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "predictions": [
    {
      "model": "Model A",
      "modelIcon": "cpu",
      "outcome": "YES",
      "confidence": 85,
      "reasoning": "Strong positive sentiment in recent news coverage...",
      "sources": 12
    },
    {
      "model": "Model B",
      "modelIcon": "brain",
      "outcome": "NO",
      "confidence": 65,
      "reasoning": "Recent diplomatic setbacks suggest uncertainty...",
      "sources": 8
    }
  ],
  "timeline": [
    {
      "date": "2025-10-01",
      "label": "News",
      "type": "positive",
      "description": "Major announcement from key stakeholder"
    },
    {
      "date": "2025-10-15",
      "label": "Event",
      "type": "neutral",
      "description": "Official meeting scheduled"
    }
  ],
  "insights": [
    {
      "type": "agreement",
      "title": "Strong Agreement",
      "description": "3 out of 4 models predict YES with high confidence",
      "icon": "check-circle"
    },
    {
      "type": "divergent",
      "title": "Divergent View",
      "description": [
        "Model D disagrees based on recent diplomatic setbacks",
        "This represents a 25% probability scenario"
      ],
      "icon": "alert-triangle"
    }
  ]
}
```

**Формат ответа:**
```json
{
  "success": true,
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Ошибка анализа

**URL:** `https://your-domain.com/api/webhooks/analysis-error`

**Метод:** POST

**Формат запроса:**
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "error_message": "Failed to fetch news data"
}
```

**Формат ответа:**
```json
{
  "success": true,
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Типы данных

### Prediction
```typescript
{
  model: string;           // Название модели, например "Model A"
  modelIcon: string;       // Иконка: "cpu" | "brain" | "crystal" | "zap"
  outcome: string;         // "YES" | "NO" или текстовое описание
  confidence: number;      // 0-100
  reasoning: string;       // Объяснение прогноза
  sources: number;         // Количество источников
}
```

### TimelineEvent
```typescript
{
  date: string;           // ISO date, например "2025-10-01"
  label: string;          // Короткая метка, например "News"
  type: "positive" | "neutral" | "negative";
  description: string;    // Описание события
}
```

### Insight
```typescript
{
  type: "agreement" | "divergent" | "risk";
  title: string;          // Заголовок инсайта
  description: string | string[];  // Описание (может быть массивом)
  icon: string;           // Название иконки
}
```

---

## Примечания

1. Все поля `predictions`, `timeline`, `insights` опциональны
2. Если анализ не удался, используйте endpoint `/analysis-error`
3. `analysis_id` должен совпадать с ID, полученным в исходном запросе
4. Поле `status` может быть "completed" или "failed"
5. После получения результатов пользователь будет автоматически перенаправлен на страницу результатов

