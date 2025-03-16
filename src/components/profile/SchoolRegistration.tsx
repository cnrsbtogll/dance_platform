// src/components/profile/SchoolRegistration.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppDispatch, RootState } from '../../App';

const SchoolRegistration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  
  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [certifications, setCertifications] = useState<File[]>([]);
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user is a school
    if (user.role !== 'school') {
      navigate('/progress');
      return;
    }
    
    // Pre-fill email
    if (user.email) {
      setEmail(user.email);
    }
    
    // Pre-fill phone number if available
    if (user.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!schoolName.trim()) errors.schoolName = 'School name is required';
    if (!address.trim()) errors.address = 'Address is required';
    if (!phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    
    if (!taxId.trim()) errors.taxId = 'Tax ID is required';
    if (certifications.length === 0) errors.certifications = 'At least one certification document is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files);
      setCertifications(prevCertifications => [...prevCertifications, ...fileList]);
    }
  };
  
  const removeFile = (index: number) => {
    setCertifications(prevCertifications => 
      prevCertifications.filter((_, i) => i !== index)
    );
  };

  const handleSocialMediaChange = (platform: keyof typeof socialMediaLinks, value: string) => {
    setSocialMediaLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;
    
    setSubmitting(true);
    
    try {
      // In a real application, we would upload certification files to storage
      // Here we'll just store the file names
      const certificationUrls = certifications.map(file => `certifications/${user.id}/${file.name}`);
      
      // Create school document
      const schoolData = {
        id: `school-${user.id}`,
        userId: user.id,
        name: schoolName,
        description,
        address,
        phoneNumber,
        email,
        website,
        socialMediaLinks,
        taxId,
        certificationUrls,
        instructorIds: [],
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'danceSchools', `school-${user.id}`), schoolData);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/progress');
      }, 2000);
    } catch (error) {
      console.error('Error registering school:', error);
      setFormErrors({
        submit: 'Failed to register. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-2 text-xl font-medium text-gray-900">Registration Successful</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your dance school registration has been submitted for verification. 
              We'll notify you when the verification is complete.
            </p>
            <div className="mt-4">
              <p className="text-xs text-gray-500">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Dance School Registration
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Please provide details about your dance school for verification
            </p>
          </div>
          
          {formErrors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{formErrors.submit}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* School Name */}
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                    School Name*
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formErrors.schoolName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.schoolName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.schoolName}</p>
                  )}
                </div>
                
                {/* Tax ID */}
                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                    Tax ID / Business Registration Number*
                  </label>
                  <input
                    type="text"
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formErrors.taxId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.taxId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.taxId}</p>
                  )}
                </div>
                
                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address*
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formErrors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email*
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                
                {/* Website */}
                <div className="sm:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      https://
                    </span>
                    <input
                      type="text"
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="www.example.com"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                    />
                  </div>
                </div>
                
                {/* Social Media Links */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Social Media (Optional)</label>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        Instagram
                      </span>
                      <input
                        type="text"
                        value={socialMediaLinks.instagram}
                        onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                        placeholder="@username"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      />
                    </div>
                    
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        Facebook
                      </span>
                      <input
                        type="text"
                        value={socialMediaLinks.facebook}
                        onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                        placeholder="@page"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      />
                    </div>
                    
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        YouTube
                      </span>
                      <input
                        type="text"
                        value={socialMediaLinks.youtube}
                        onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                        placeholder="channel name"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      />
                    </div>
                    
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        TikTok
                      </span>
                      <input
                        type="text"
                        value={socialMediaLinks.tiktok}
                        onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                        placeholder="@username"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    School Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tell us about your dance school, specialties, and history..."
                    />
                  </div>
                </div>
                
                {/* Certification Documents */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Certification Documents*
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="certification-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="certification-upload"
                            name="certification-upload"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG up to 10MB each
                      </p>
                    </div>
                  </div>
                  {formErrors.certifications && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.certifications}</p>
                  )}
                  
                  {/* Display selected files */}
                  {certifications.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                      <ul className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-md">
                        {certifications.map((file, index) => (
                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolRegistration;