-- Insertar preguntas de ejemplo para "Pregunta del Día"
INSERT INTO daily_questions (question, category) VALUES
-- Categoría: Amor
('¿Cuál fue el momento exacto en que supiste que estabas enamorado/a?', 'love'),
('¿Qué es lo que más te gusta de nuestra relación?', 'love'),
('¿Cuál ha sido tu cita favorita hasta ahora?', 'love'),
('¿Qué gesto pequeño mío te hace sonreír?', 'love'),
('¿Cómo te imaginas que será nuestro aniversario número 50?', 'love'),

-- Categoría: Sueños
('Si pudieras vivir en cualquier lugar del mundo, ¿dónde sería y por qué?', 'dreams'),
('¿Cuál es tu mayor sueño que aún no has compartido conmigo?', 'dreams'),
('Si pudiéramos hacer realidad un deseo juntos, ¿cuál sería?', 'dreams'),
('¿Qué te gustaría lograr en los próximos 5 años?', 'dreams'),
('Si pudieras cambiar de carrera sin consecuencias, ¿qué harías?', 'dreams'),

-- Categoría: Pasado
('¿Cuál es tu recuerdo de infancia favorito?', 'past'),
('¿Qué fue lo primero que pensaste de mí cuando nos conocimos?', 'past'),
('¿Cuál fue tu momento más vergonzoso?', 'past'),
('¿Qué consejo le darías a tu yo de hace 10 años?', 'past'),
('¿Cuál fue el mejor regalo que recibiste de niño/a?', 'past'),

-- Categoría: Futuro
('¿Cómo te imaginas nuestra vida en 10 años?', 'future'),
('¿Quieres tener hijos? ¿Cuántos?', 'future'),
('¿Dónde te gustaría que viviéramos cuando seamos mayores?', 'future'),
('¿Qué tradiciones quieres que tengamos como pareja?', 'future'),
('¿Qué aventura te gustaría que viviéramos juntos?', 'future'),

-- Categoría: Divertidas
('Si fueras un superhéroe, ¿cuál sería tu superpoder?', 'fun'),
('¿Qué película podrías ver una y otra vez sin cansarte?', 'fun'),
('Si fueras un animal, ¿cuál serías y por qué?', 'fun'),
('¿Cuál es tu comida favorita que yo cocino (o debería aprender a cocinar)?', 'fun'),
('Si pudieras cenar con cualquier persona viva o muerta, ¿quién sería?', 'fun'),

-- Categoría: Profundas
('¿Qué es lo que más valoras en la vida?', 'deep'),
('¿Cuál es tu mayor miedo en nuestra relación?', 'deep'),
('¿Qué te hace sentir más amado/a?', 'deep'),
('¿Cómo podemos mejorar nuestra comunicación?', 'deep'),
('¿Qué significa el compromiso para ti?', 'deep'),
('¿Cuál es tu mayor inseguridad personal?', 'deep'),
('¿Qué te hace sentir más conectado/a conmigo?', 'deep'),
('¿Hay algo que quieras que cambie en nuestra relación?', 'deep'),

-- Más preguntas variadas
('¿Cuál es tu canción favorita para dedicarme?', 'love'),
('¿Qué actividad te gustaría que hiciéramos más seguido juntos?', 'fun'),
('¿Cuál es tu forma favorita de celebrar los logros?', 'fun'),
('Si pudieras aprender una habilidad nueva instantáneamente, ¿cuál sería?', 'dreams'),
('¿Qué te gustaría que recordáramos de este año en el futuro?', 'future'),
('¿Cuál es tu manera favorita de pasar un domingo?', 'fun'),
('¿Qué tradición familiar te gustaría traer a nuestra relación?', 'past'),
('¿Cuál es tu lenguaje de amor principal?', 'deep'),
('Si tuvieras que describir nuestro amor en tres palabras, ¿cuáles serían?', 'love'),
('¿Qué te hace sentir más apreciado/a en nuestra relación?', 'deep')

ON CONFLICT (question) DO NOTHING;
