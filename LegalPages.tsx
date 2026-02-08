import React from 'react';

const LegalLayout: React.FC<{ title: string; onBack: () => void; children: React.ReactNode }> = ({ title, onBack, children }) => (
    <div className="flex flex-col items-center gap-8 py-6 animate-drop w-full max-w-4xl max-h-[85vh]">
        <div className="text-center space-y-3">
            <h2 className="font-['Bebas_Neue'] text-5xl tracking-widest uppercase text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {title}
            </h2>
        </div>

        <div className="w-full border-2 border-amber-500/30 bg-black/80 overflow-y-auto p-8 md:p-12 text-justify crt-text text-sm md:text-base leading-relaxed text-amber-500/80 scrollbar-thin scrollbar-thumb-amber-500 h-[60vh]">
            {children}
        </div>

        <button onClick={onBack} className="retro-button px-12 py-4 w-full max-w-sm uppercase">
            VOLVER AL MENÚ
        </button>
    </div>
);

export const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <LegalLayout title="POLÍTICA DE PRIVACIDAD" onBack={onBack}>
        {/* SEO Introduction */}
        <div className="mb-8 p-4 border-l-4 border-amber-500 bg-amber-500/5">
            <p className="text-sm opacity-90 italic">
                En RankMyWord, la privacidad de nuestros usuarios es una prioridad. Este documento te explica de forma transparente cómo protegemos tus datos mientras disfrutas del mejor juego de palabras con Inteligencia Artificial del mercado.
            </p>
        </div>
        <p className="mb-6 opacity-70 italic">Última actualización: {new Date().toLocaleDateString()}</p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">1. RESPONSABLE DEL TRATAMIENTO</h3>
        <p className="mb-6">
            En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), le informamos que los datos personales facilitados serán tratados por:<br /><br />
            <strong>Razón Social:</strong> ZONA DE DRONES S.L.<br />
            <strong>C.I.F.:</strong> B16880270<br />
            <strong>Domicilio Social:</strong> C/ FERMÍN CABALLERO 64, LARRA I, 16ºC, 28034 MADRID, Madrid - España.<br />
            <strong>Email de Contacto:</strong> info@workdaynalytics.com
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">2. FINALIDAD DEL TRATAMIENTO</h3>
        <p className="mb-6">
            Tratamos la información que nos facilita con las siguientes finalidades:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Prestación del servicio:</strong> Gestionar su registro como usuario en "RankMyWord" y permitir su participación en los juegos y rankings.</li>
            <li><strong>Ranking Público:</strong> Publicar su nombre de usuario (Nick) y puntuaciones en las tablas de clasificación, siendo esta información visible para el resto de usuarios.</li>
            <li><strong>Mejora del servicio:</strong> Realizar análisis estadísticos anónimos para mejorar la jugabilidad y experiencia de usuario.</li>
            <li><strong>Seguridad:</strong> Detectar y prevenir fraudes, trampas o usos indebidos de la plataforma.</li>
        </ul>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">3. LEGITIMACIÓN</h3>
        <p className="mb-6">
            La base legal para el tratamiento de sus datos es:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Ejecución de un contrato:</strong> Al registrarse y aceptar los términos, se establece una relación contractual para el uso de la aplicación.</li>
            <li><strong>Interés legítimo:</strong> Para garantizar la seguridad del juego y mantener la integridad de los rankings.</li>
            <li><strong>Consentimiento:</strong> Para el uso de cookies no técnicas, si las hubiere.</li>
        </ul>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">4. CONSERVACIÓN DE DATOS</h3>
        <p className="mb-6">
            Los datos se conservarán mientras mantenga su condición de usuario registrado. Si decide darse de baja, sus datos personales serán bloqueados durante los plazos legales aplicables y posteriormente eliminados. Las puntuaciones asociadas a un Nick eliminado podrán mantenerse anonimizadas para no alterar el histórico de rankings.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">5. DESTINATARIOS</h3>
        <p className="mb-6">
            No se cederán datos a terceros, salvo obligación legal.
        </p>
        <p className="mb-6">
            <strong>Transferencias Internacionales:</strong> Utilizamos proveedores de servicios tecnológicos (como Google Cloud/Supabase) que pueden ubicar servidores fuera de la UE. Garantizamos que dichas transferencias se realizan bajo el amparo de Cláusulas Contractuales Tipo aprobadas por la Comisión Europea o marcos de adecuación vigentes.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">6. DERECHOS DEL USUARIO</h3>
        <p className="mb-6">
            Puede ejercer sus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición enviando un correo a <strong>info@workdaynalytics.com</strong>, adjuntando copia de su DNI.
        </p>
    </LegalLayout>
);

export const TermsOfService: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <LegalLayout title="TÉRMINOS Y CONDICIONES" onBack={onBack}>
        {/* SEO Introduction */}
        <div className="mb-8 p-4 border-l-4 border-amber-500 bg-amber-500/5">
            <p className="text-sm opacity-90 italic">
                Bienvenido a RankMyWord, el juego de asociación semántica que utiliza Inteligencia Artificial para evaluar tu creatividad lingüística. Al usar nuestra plataforma, aceptas las siguientes condiciones que garantizan una experiencia justa y segura para toda la comunidad de jugadores.
            </p>
        </div>
        <p className="mb-6 opacity-70 italic">Última actualización: {new Date().toLocaleDateString()}</p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
        <p className="mb-6">
            El acceso y uso de "RankMyWord" atribuye la condición de Usuario e implica la aceptación plena y sin reservas de los presentes Términos y Condiciones. Si no está de acuerdo, le rogamos se abstenga de utilizar la aplicación.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">2. USO CORRECTO DEL SERVICIO</h3>
        <p className="mb-6">
            El Usuario se compromete a utilizar la aplicación, sus contenidos y servicios de conformidad con la Ley, las presentes condiciones y el orden público. Queda expresamente prohibido:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Utilizar sistemas automatizados (bots, scripts) para jugar o alterar puntuaciones.</li>
            <li>Realizar ingeniería inversa o intentar acceder al código fuente o APIs no públicas.</li>
            <li>Utilizar Nicks (nombres de usuario) ofensivos, injuriosos o que vulneren derechos de terceros.</li>
            <li>Introducir virus informáticos o realizar acciones que puedan dañar o sobrecargar los sistemas de ZONA DE DRONES S.L.</li>
        </ul>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">3. PROPIEDAD INTELECTUAL E INDUSTRIAL</h3>
        <p className="mb-6">
            Todos los derechos de propiedad intelectual del sitio web (código fuente, diseño gráfico, mecánica de juego, textos y logos) son titularidad exclusiva de <strong>ZONA DE DRONES S.L.</strong>. Queda prohibida su reproducción, distribución, comunicación pública o transformación sin autorización expresa.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">4. RESPONSABILIDAD</h3>
        <p className="mb-6">
            La Empresa no garantiza la disponibilidad continua y permanente de los servicios, quedando exonerada de cualquier responsabilidad por posibles daños y perjuicios causados por la falta de disponibilidad del servicio por causas de fuerza mayor o errores en las redes telemáticas de transferencia de datos.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">5. MODIFICACIONES</h3>
        <p className="mb-6">
            ZONA DE DRONES S.L. se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">6. LEY APLICABLE Y JURISDICCIÓN</h3>
        <p className="mb-6">
            Para la resolución de todas las controversias o cuestiones relacionadas con el presente sitio web o de las actividades en él desarrolladas, será de aplicación la legislación española, a la que se someten expresamente las partes, siendo competentes para la resolución de todos los conflictos derivados o relacionados con su uso los Juzgados y Tribunales de MADRID Capital.
        </p>
    </LegalLayout>
);

export const ContactPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) return;

        setStatus('sending');
        try {
            const response = await fetch("https://formsubmit.co/ajax/info@workdaynalytics.com", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    ...formData,
                    _subject: `Nuevo mensaje de RankMyWord: ${formData.name}`,
                    _template: "table"
                })
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error("Error sending form:", error);
            setStatus('error');
        }
    };

    return (
        <LegalLayout title="CONTACTO" onBack={onBack}>
            <div className="space-y-8">
                <div className="border border-amber-500/20 p-6 bg-amber-500/5">
                    <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">¿CÓMO PODEMOS AYUDARTE?</h3>
                    <p className="mb-4">
                        Para cualquier consulta técnica, duda sobre el funcionamiento del juego, reportar errores o ejercer sus derechos de privacidad, puede ponerse en contacto con nuestro equipo de soporte.
                    </p>
                    <p className="text-xs opacity-70">
                        RankMyWord es un juego de palabras innovador desarrollado en España que combina creatividad lingüística con Inteligencia Artificial. Nuestro equipo está comprometido a ofrecerte la mejor experiencia de entretenimiento educativo basado en semántica avanzada.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="border border-amber-500/20 p-6">
                        <h4 className="font-bold text-amber-500 uppercase mb-2">EMAIL PRINCIPAL</h4>
                        <p className="text-lg font-bold">info@workdaynalytics.com</p>
                        <p className="text-xs opacity-50 mt-2 uppercase">Respuesta en menos de 48h hábiles</p>
                    </div>
                    <div className="border border-amber-500/20 p-6">
                        <h4 className="font-bold text-amber-500 uppercase mb-2">UBICACIÓN SOCIAL</h4>
                        <p className="text-sm">ZONA DE DRONES S.L.<br />C/ Fermín Caballero 64, Madrid</p>
                    </div>
                </div>

                <div className="border-t border-amber-500/20 pt-6">
                    <h3 className="text-lg font-bold mb-4 uppercase text-amber-500 opacity-60">FORMULARIO DE CONTACTO</h3>

                    {status === 'success' ? (
                        <div className="border border-green-500/30 bg-green-500/5 p-8 text-center animate-drop">
                            <h4 className="text-green-500 font-bold uppercase mb-2">¡MENSAJE ENVIADO!</h4>
                            <p className="text-sm opacity-80">GRACIAS POR CONTACTARNOS. TE RESPONDEREMOS LO ANTES POSIBLE.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-6 text-[10px] text-amber-500 underline uppercase tracking-widest"
                            >
                                ENVIAR OTRO MENSAJE
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase tracking-widest opacity-60">NOMBRE</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-black/40 border border-amber-500/40 p-3 crt-text text-sm focus:border-amber-500 outline-none transition-colors"
                                        placeholder="TU NOMBRE..."
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] uppercase tracking-widest opacity-60">EMAIL</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-black/40 border border-amber-500/40 p-3 crt-text text-sm focus:border-amber-500 outline-none transition-colors"
                                        placeholder="TU@EMAIL.COM"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest opacity-60">MENSAJE</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="bg-black/40 border border-amber-500/40 p-3 crt-text text-sm focus:border-amber-500 outline-none transition-colors resize-none"
                                    placeholder="¿EN QUÉ PODEMOS AYUDARTE?"
                                />
                            </div>

                            {status === 'error' && (
                                <p className="text-red-500 text-[10px] uppercase tracking-widest animate-blink">
                                    ERROR AL ENVIAR. POR FAVOR, INTÉNTALO DE NUEVO O USA EL EMAIL.
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className={`retro-button py-3 text-center text-sm w-full uppercase transition-all ${status === 'sending' ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {status === 'sending' ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </LegalLayout>
    );
};

export const MethodologyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <LegalLayout title="METODOLOGÍA E IA" onBack={onBack}>
        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">EL CORAZÓN DE RANKMYWORD</h3>
        <p className="mb-6">
            RankMyWord no es solo un juego de palabras; es un experimento vivo sobre la intersección entre la semántica humana y el razonamiento sintético de la Inteligencia Artificial. En un mundo saturado de algoritmos predictivos, nuestra misión es medir la capacidad de asociación creativa que solo el ser humano posee, utilizando la propia IA como juez imparcial y "sentiente".
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">¿CÓMO FUNCIONA NUESTRO "JUEZ"?</h3>
        <p className="mb-6">
            Para evaluar cada partida, utilizamos modelos de lenguaje de última generación (LLM) basados en redes neuronales de aprendizaje profundo. A diferencia de un diccionario tradicional que solo verifica si una palabra existe, nuestro sistema analiza el <strong>espacio latente</strong> entre los conceptos.
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Análisis Semántico:</strong> La IA descompone ambos términos (la palabra propuesta por el sistema y la respuesta del usuario) en vectores multidimensionales.</li>
            <li><strong>Cálculo de Proximidad Conceptual:</strong> Se evalúa no solo la cercanía lingüística (sinonimia), sino la relevancia cultural, emocional y lógica.</li>
            <li><strong>Detección de Creatividad:</strong> Nuestro algoritmo está programado para penalizar lo obvio (ej. Sal - Pimienta) y premiar aquellas asociaciones "periféricas" que, aunque distantes, guardan un hilo conductor poético e inteligente.</li>
        </ul>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">NUESTRA VISIÓN FILOSÓFICA</h3>
        <p className="mb-6">
            RankMyWord nace con la visión de celebrar y explorar la agilidad mental del ser humano. En un entorno digital dominado por respuestas automatizadas, buscamos fomentar un espacio donde el pensamiento crítico y la asociación libre de ideas sean los protagonistas. Queremos demostrar que, a pesar del avance tecnológico, la capacidad humana para crear nexos poéticos y lógicos sigue siendo una frontera insuperable para el código estático.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">TECNOLOGÍA RETRO-FUTURISTA</h3>
        <p className="mb-6">
            Utilizamos una arquitectura basada en microservicios, con integración directa con Google Gemini y modelos Claude de Anthropic. Los resultados se procesan en tiempo real, generando una personalidad única para nuestra IA, que reacciona emocionalmente a la calidad de tus asociaciones lingüísticas.
        </p>

        <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">COMPROMISO CON LA CALIDAD</h3>
        <p className="mb-6">
            Este proyecto cumple con los más altos estándares de desarrollo web moderno, optimizando tanto el rendimiento como la relevancia del contenido. RankMyWord es una herramienta educativa y de entretenimiento que promueve la riqueza del léxico español y el pensamiento crítico en el uso de nuevas tecnologías.
        </p>
    </LegalLayout>
);

export const FAQPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <LegalLayout title="PREGUNTAS FRECUENTES" onBack={onBack}>
        {/* SEO Introduction */}
        <div className="mb-8 p-4 border-l-4 border-amber-500 bg-amber-500/5">
            <p className="text-sm opacity-90 italic">
                Resuelve tus dudas sobre RankMyWord, el juego de palabras e Inteligencia Artificial que está revolucionando el entretenimiento educativo en español. Aquí encontrarás respuestas a las preguntas más comunes de nuestra comunidad de jugadores.
            </p>
        </div>
        <div className="space-y-6 text-left">
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Qué es RankMyWord?</h4>
                <p>Es un juego de asociación semántica donde una IA evalúa la relación lógica y creativa entre dos palabras. A diferencia de otros juegos como Wordle o crucigramas, aquí no buscas una palabra exacta, sino la conexión conceptual perfecta que sorprenda a nuestra Inteligencia Artificial.</p>
            </div>
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Cómo se puntúa?</h4>
                <p>La IA busca el "punto dulce": ni demasiado obvio ni demasiado extraño. Una conexión inteligente y sorprendente obtiene la mejor nota. Utilizamos modelos de lenguaje avanzados como Gemini y Claude para analizar la calidad semántica de tu respuesta.</p>
            </div>
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Cada cuánto hay nuevas palabras?</h4>
                <p>El reto diario se actualiza automáticamente cada 4 horas con 3 nuevas palabras para que siempre tengas un desafío fresco. Esto significa que puedes competir múltiples veces al día en el ranking global.</p>
            </div>
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Es gratuito?</h4>
                <p>Actualmente RankMyWord es completamente gratuito. Puedes registrarte, jugar y competir en el ranking mundial sin ningún coste. No obstante, nos reservamos el derecho de implementar modelos basados en suscripción o funciones premium en el futuro.</p>
            </div>
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Mis datos están seguros?</h4>
                <p>Solo guardamos tu Nick y puntuaciones para el ranking. No recopilamos información personal sensible sin tu consentimiento. Cumplimos con el RGPD europeo y la LOPDGDD española.</p>
            </div>
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Puedo jugar en móvil?</h4>
                <p>Sí, RankMyWord está diseñado con un diseño responsive que se adapta perfectamente a cualquier dispositivo: móvil, tablet u ordenador de escritorio.</p>
            </div>
            <div>
                <h4 className="text-amber-500 font-bold uppercase mb-2">¿Qué es el modo Duelo Local?</h4>
                <p>El modo multijugador local te permite competir cara a cara con amigos y familiares en el mismo dispositivo. Cada jugador introduce su respuesta por turnos y la IA evalúa quién ha logrado la mejor asociación semántica.</p>
            </div>
        </div>
    </LegalLayout>
);

export const AboutUs: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <LegalLayout title="QUIÉNES SOMOS" onBack={onBack}>
        <div className="space-y-8">
            <div className="border border-amber-500/20 p-6 bg-amber-500/5">
                <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">NUESTRA HISTORIA</h3>
                <p className="mb-4">
                    RankMyWord nació en 2024 como un experimento dentro de <strong>ZONA DE DRONES S.L.</strong>, una empresa tecnológica española con sede en Madrid dedicada a explorar las fronteras del software y la inteligencia artificial.
                </p>
                <p className="mb-4">
                    Lo que comenzó como una curiosidad sobre cómo una IA evaluaría el "ingenio" humano se convirtió en una plataforma completa de juego semántico que hoy disfrutan miles de usuarios.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-amber-500/20 p-6">
                    <h4 className="font-bold text-amber-500 uppercase mb-2">MISIÓN</h4>
                    <p className="text-sm opacity-80">Fomentar la agilidad mental y la riqueza del lenguaje a través de la tecnología, creando puentes entre la lógica humana y la artificial.</p>
                </div>
                <div className="border border-amber-500/20 p-6">
                    <h4 className="font-bold text-amber-500 uppercase mb-2">VISIÓN</h4>
                    <p className="text-sm opacity-80">Convertirnos en el referente de juegos semánticos en español, utilizando la IA no para reemplazarnos, sino para desafiarnos.</p>
                </div>
            </div>

            <div className="border border-amber-500/20 p-6 bg-amber-500/5">
                <h3 className="text-xl font-bold mb-4 uppercase text-amber-500">NUESTRO EQUIPO</h3>
                <p className="mb-4 text-sm">
                    Contamos con un equipo multidisciplinar de desarrolladores, lingüistas y expertos en IA en España. Creemos que el código tiene poesía y que la tecnología debe ser, ante todo, divertida y educativa.
                </p>
                <div className="flex flex-col gap-2 mt-4">
                    <p className="text-xs"><strong>Empresa:</strong> ZONA DE DRONES S.L.</p>
                    <p className="text-xs"><strong>Sede:</strong> Madrid, España</p>
                    <p className="text-xs"><strong>Especialidad:</strong> Desarrollo de software e IA generativa.</p>
                </div>
            </div>

            <div className="text-center opacity-40 italic text-xs mt-8">
                "El lenguaje es la única frontera que la IA aún intenta cruzar con elegancia. Nosotros le ponemos el mapa."
            </div>
        </div>
    </LegalLayout>
);
