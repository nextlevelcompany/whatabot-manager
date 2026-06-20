package com.nextlead;

import com.nextlead.dao.ContactDao;
import com.nextlead.dao.UserDao;
import com.nextlead.models.Contact;
import com.nextlead.models.Direccion;
import com.nextlead.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final UserDao userDao;
    private final ContactDao contactDao;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DatabaseInitializer(UserDao userDao, ContactDao contactDao,
                               PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userDao = userDao;
        this.contactDao = contactDao;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // ── Usuario administrador ───────────────────────────────────────────
        if (!userDao.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userDao.save(admin);
            System.out.println(">>> Usuario administrador por defecto ('admin' / 'admin123') creado.");
        }

        // ── Catálogo de Ubigeo (muestra representativa INEI) ───────────────
        Long ubigeoCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ubigeo_peru", Long.class);
        if (ubigeoCount == null || ubigeoCount == 0) {
            System.out.println(">>> Cargando catálogo de Ubigeo Perú...");
            String sql = "INSERT INTO ubigeo_peru (codigo_ubigeo, departamento, provincia, distrito) VALUES (?,?,?,?) ON CONFLICT DO NOTHING";

            // Lima - Provincia Lima
            Object[][] lima = {
                {"150101","LIMA","LIMA","LIMA"},
                {"150102","LIMA","LIMA","ANCON"},
                {"150103","LIMA","LIMA","ATE"},
                {"150104","LIMA","LIMA","BARRANCO"},
                {"150105","LIMA","LIMA","BREÑA"},
                {"150106","LIMA","LIMA","CARABAYLLO"},
                {"150107","LIMA","LIMA","CHACLACAYO"},
                {"150108","LIMA","LIMA","CHORRILLOS"},
                {"150109","LIMA","LIMA","CIENEGUILLA"},
                {"150110","LIMA","LIMA","COMAS"},
                {"150111","LIMA","LIMA","EL AGUSTINO"},
                {"150112","LIMA","LIMA","INDEPENDENCIA"},
                {"150113","LIMA","LIMA","JESUS MARIA"},
                {"150114","LIMA","LIMA","LA MOLINA"},
                {"150115","LIMA","LIMA","LA VICTORIA"},
                {"150116","LIMA","LIMA","LINCE"},
                {"150117","LIMA","LIMA","LOS OLIVOS"},
                {"150118","LIMA","LIMA","LURIGANCHO"},
                {"150119","LIMA","LIMA","LURIN"},
                {"150120","LIMA","LIMA","MAGDALENA DEL MAR"},
                {"150121","LIMA","LIMA","MAGDALENA VIEJA"},
                {"150122","LIMA","LIMA","MIRAFLORES"},
                {"150123","LIMA","LIMA","PACHACAMAC"},
                {"150124","LIMA","LIMA","PUCUSANA"},
                {"150125","LIMA","LIMA","PUEBLO LIBRE"},
                {"150126","LIMA","LIMA","PUENTE PIEDRA"},
                {"150127","LIMA","LIMA","PUNTA HERMOSA"},
                {"150128","LIMA","LIMA","PUNTA NEGRA"},
                {"150129","LIMA","LIMA","RIMAC"},
                {"150130","LIMA","LIMA","SAN BARTOLO"},
                {"150131","LIMA","LIMA","SAN BORJA"},
                {"150132","LIMA","LIMA","SAN ISIDRO"},
                {"150133","LIMA","LIMA","SAN JUAN DE LURIGANCHO"},
                {"150134","LIMA","LIMA","SAN JUAN DE MIRAFLORES"},
                {"150135","LIMA","LIMA","SAN LUIS"},
                {"150136","LIMA","LIMA","SAN MARTIN DE PORRES"},
                {"150137","LIMA","LIMA","SAN MIGUEL"},
                {"150138","LIMA","LIMA","SANTA ANITA"},
                {"150139","LIMA","LIMA","SANTA MARIA DEL MAR"},
                {"150140","LIMA","LIMA","SANTA ROSA"},
                {"150141","LIMA","LIMA","SANTIAGO DE SURCO"},
                {"150142","LIMA","LIMA","SURQUILLO"},
                {"150143","LIMA","LIMA","VILLA EL SALVADOR"},
                {"150144","LIMA","LIMA","VILLA MARIA DEL TRIUNFO"},
            };
            // Lima - Callao
            Object[][] callao = {
                {"070101","CALLAO","CALLAO","CALLAO"},
                {"070102","CALLAO","CALLAO","BELLAVISTA"},
                {"070103","CALLAO","CALLAO","CARMEN DE LA LEGUA REYNOSO"},
                {"070104","CALLAO","CALLAO","LA PERLA"},
                {"070105","CALLAO","CALLAO","LA PUNTA"},
                {"070106","CALLAO","CALLAO","VENTANILLA"},
                {"070107","CALLAO","CALLAO","MI PERU"},
            };
            // Lima - Huarochiri
            Object[][] huarochiri = {
                {"150901","LIMA","HUAROCHIRI","MATUCANA"},
                {"150902","LIMA","HUAROCHIRI","ANTIOQUÍA"},
                {"150903","LIMA","HUAROCHIRI","CALLAHUANCA"},
                {"150904","LIMA","HUAROCHIRI","CARAMPOMA"},
                {"150905","LIMA","HUAROCHIRI","CHICLA"},
            };
            // Arequipa
            Object[][] arequipa = {
                {"040101","AREQUIPA","AREQUIPA","AREQUIPA"},
                {"040102","AREQUIPA","AREQUIPA","ALTO SELVA ALEGRE"},
                {"040103","AREQUIPA","AREQUIPA","CAYMA"},
                {"040104","AREQUIPA","AREQUIPA","CERRO COLORADO"},
                {"040105","AREQUIPA","AREQUIPA","CHARACATO"},
                {"040106","AREQUIPA","AREQUIPA","CHIGUATA"},
                {"040107","AREQUIPA","AREQUIPA","JACOBO HUNTER"},
                {"040108","AREQUIPA","AREQUIPA","LA JOYA"},
                {"040109","AREQUIPA","AREQUIPA","MARIANO MELGAR"},
                {"040110","AREQUIPA","AREQUIPA","MIRAFLORES"},
                {"040111","AREQUIPA","AREQUIPA","MOLLEBAYA"},
                {"040112","AREQUIPA","AREQUIPA","PAUCARPATA"},
                {"040113","AREQUIPA","AREQUIPA","POCSI"},
                {"040114","AREQUIPA","AREQUIPA","POLOBAYA"},
                {"040115","AREQUIPA","AREQUIPA","QUEQUEÑA"},
                {"040116","AREQUIPA","AREQUIPA","SABANDIA"},
                {"040117","AREQUIPA","AREQUIPA","SACHACA"},
                {"040118","AREQUIPA","AREQUIPA","SAN JUAN DE SIGUAS"},
                {"040119","AREQUIPA","AREQUIPA","SAN JUAN DE TARUCANI"},
                {"040120","AREQUIPA","AREQUIPA","SANTA ISABEL DE SIGUAS"},
                {"040121","AREQUIPA","AREQUIPA","SANTA RITA DE SIGUAS"},
                {"040122","AREQUIPA","AREQUIPA","SOCABAYA"},
                {"040123","AREQUIPA","AREQUIPA","TIABAYA"},
                {"040124","AREQUIPA","AREQUIPA","UCHUMAYO"},
                {"040125","AREQUIPA","AREQUIPA","VITOR"},
                {"040126","AREQUIPA","AREQUIPA","YANAHUARA"},
                {"040127","AREQUIPA","AREQUIPA","YARABAMBA"},
                {"040128","AREQUIPA","AREQUIPA","YURA"},
                {"040129","AREQUIPA","AREQUIPA","JOSE LUIS BUSTAMANTE Y RIVERO"},
            };
            // Cusco
            Object[][] cusco = {
                {"080101","CUSCO","CUSCO","CUSCO"},
                {"080102","CUSCO","CUSCO","CCORCA"},
                {"080103","CUSCO","CUSCO","POROY"},
                {"080104","CUSCO","CUSCO","SAN JERONIMO"},
                {"080105","CUSCO","CUSCO","SAN SEBASTIAN"},
                {"080106","CUSCO","CUSCO","SANTIAGO"},
                {"080107","CUSCO","CUSCO","SAYLLA"},
                {"080108","CUSCO","CUSCO","WANCHAQ"},
            };
            // Trujillo
            Object[][] trujillo = {
                {"130101","LA LIBERTAD","TRUJILLO","TRUJILLO"},
                {"130102","LA LIBERTAD","TRUJILLO","EL PORVENIR"},
                {"130103","LA LIBERTAD","TRUJILLO","FLORENCIA DE MORA"},
                {"130104","LA LIBERTAD","TRUJILLO","HUANCHACO"},
                {"130105","LA LIBERTAD","TRUJILLO","LA ESPERANZA"},
                {"130106","LA LIBERTAD","TRUJILLO","LAREDO"},
                {"130107","LA LIBERTAD","TRUJILLO","MOCHE"},
                {"130108","LA LIBERTAD","TRUJILLO","POROTO"},
                {"130109","LA LIBERTAD","TRUJILLO","SALAVERRY"},
                {"130110","LA LIBERTAD","TRUJILLO","SIMBAL"},
                {"130111","LA LIBERTAD","TRUJILLO","VICTOR LARCO HERRERA"},
            };
            // Chiclayo
            Object[][] chiclayo = {
                {"140101","LAMBAYEQUE","CHICLAYO","CHICLAYO"},
                {"140102","LAMBAYEQUE","CHICLAYO","CHONGOYAPE"},
                {"140103","LAMBAYEQUE","CHICLAYO","ETEN"},
                {"140104","LAMBAYEQUE","CHICLAYO","ETEN PUERTO"},
                {"140105","LAMBAYEQUE","CHICLAYO","JOSE LEONARDO ORTIZ"},
                {"140106","LAMBAYEQUE","CHICLAYO","LA VICTORIA"},
                {"140107","LAMBAYEQUE","CHICLAYO","LAGUNAS"},
                {"140108","LAMBAYEQUE","CHICLAYO","MONSEFU"},
                {"140109","LAMBAYEQUE","CHICLAYO","NUEVA ARICA"},
                {"140110","LAMBAYEQUE","CHICLAYO","OYOTUN"},
                {"140111","LAMBAYEQUE","CHICLAYO","PATAPO"},
                {"140112","LAMBAYEQUE","CHICLAYO","PICSI"},
                {"140113","LAMBAYEQUE","CHICLAYO","PIMENTEL"},
                {"140114","LAMBAYEQUE","CHICLAYO","REQUE"},
                {"140115","LAMBAYEQUE","CHICLAYO","SANTA ROSA"},
                {"140116","LAMBAYEQUE","CHICLAYO","SAÑA"},
                {"140117","LAMBAYEQUE","CHICLAYO","CAYALTI"},
                {"140118","LAMBAYEQUE","CHICLAYO","PUCALA"},
                {"140119","LAMBAYEQUE","CHICLAYO","TUMAN"},
                {"140120","LAMBAYEQUE","CHICLAYO","CIUDAD ETEN"},
            };
            // Piura
            Object[][] piura = {
                {"200101","PIURA","PIURA","PIURA"},
                {"200102","PIURA","PIURA","CASTILLA"},
                {"200103","PIURA","PIURA","CATACAOS"},
                {"200104","PIURA","PIURA","CURA MORI"},
                {"200105","PIURA","PIURA","EL TALLAN"},
                {"200106","PIURA","PIURA","LA ARENA"},
                {"200107","PIURA","PIURA","LA UNION"},
                {"200108","PIURA","PIURA","LAS LOMAS"},
                {"200109","PIURA","PIURA","TAMBO GRANDE"},
                {"200110","PIURA","PIURA","VEINTISEIS DE OCTUBRE"},
            };

            Object[][][] allUbigeos = {lima, callao, huarochiri, arequipa, cusco, trujillo, chiclayo, piura};
            for (Object[][] group : allUbigeos) {
                for (Object[] row : group) {
                    jdbcTemplate.update(sql, row[0], row[1], row[2], row[3]);
                }
            }
            System.out.println(">>> Ubigeo Perú cargado correctamente.");
        }

        // ── Contactos semilla ───────────────────────────────────────────────
        if (contactDao.count() == 0) {
            System.out.println(">>> Creando contactos de prueba...");

            // Empresa semilla
            Contact empresa = new Contact();
            empresa.setTipoPersona("EMPRESA");
            empresa.setTipoDocumento("RUC");
            empresa.setNumeroDocumento("20512382819");
            empresa.setRazonSocial("NextLead Technologies S.A.C.");
            empresa.setTelefonoPrincipal("016000001");
            empresa.setEmail("contacto@nextlead.pe");
            empresa.setStarred(false);

            Direccion dirEmpresa = new Direccion();
            dirEmpresa.setNombreUbicacion("Sede Principal");
            dirEmpresa.setCodigoUbigeo("150132");
            dirEmpresa.setDireccionCompleta("Av. El Derby 254, Torre 1 Piso 5");
            dirEmpresa.setReferencia("Frente al Jockey Plaza");
            dirEmpresa.setLatitud(-12.0985);
            dirEmpresa.setLongitud(-77.0363);
            empresa.setDirecciones(List.of(dirEmpresa));

            Contact empresaGuardada = contactDao.save(empresa);
            System.out.println(">>> Empresa creada con ID: " + empresaGuardada.getId());

            // Persona Natural semilla
            Contact persona = new Contact();
            persona.setTipoPersona("NATURAL");
            persona.setTipoDocumento("DNI");
            persona.setNumeroDocumento("72345678");
            persona.setNombres("Carlos Andrés");
            persona.setApellidos("Quispe Mamani");
            persona.setTelefonoPrincipal("999888777");
            persona.setEmail("carlos.quispe@email.com");
            persona.setEmpresaId(empresaGuardada.getId());
            persona.setStarred(true);

            Direccion dirPersona = new Direccion();
            dirPersona.setNombreUbicacion("Casa");
            dirPersona.setCodigoUbigeo("150122");
            dirPersona.setDireccionCompleta("Calle Schell 130, Dpto 302");
            dirPersona.setReferencia("A una cuadra de la Plaza de Miraflores");
            dirPersona.setLatitud(-12.1196);
            dirPersona.setLongitud(-77.0281);
            persona.setDirecciones(List.of(dirPersona));

            contactDao.save(persona);
            System.out.println(">>> Persona Natural semilla creada correctamente.");
        }
    }
}
