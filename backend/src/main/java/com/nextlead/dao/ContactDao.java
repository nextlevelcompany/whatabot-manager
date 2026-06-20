package com.nextlead.dao;

import com.nextlead.models.Contact;
import com.nextlead.models.Direccion;
import com.nextlead.models.Ubigeo;

import java.util.List;
import java.util.Optional;

public interface ContactDao {
    List<Contact> findAll();
    List<Contact> findAllEmpresas();
    Optional<Contact> findById(Long id);
    Contact save(Contact contact);
    void update(Contact contact);
    void deleteById(Long id);
    void updateStarred(Long id, boolean starred);
    List<Direccion> findAddressesByContactId(Long id);
    List<Contact> findPersonasByEmpresaId(Long empresaId);
    List<Ubigeo> findAllUbigeos();
    long count();
}
