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
